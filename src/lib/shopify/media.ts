/**
 * Adds images to products in a Shopify store via the Admin API and waits until Shopify has processed them,
 * or removes them again.
 */

import "server-only";
import { shopifyAdminFetch } from "./client";

// productCreateMedia is deprecated in 2026-10 ("Use productUpdate or productSet instead").
// productUpdate with `media` adds to the product's images; productSet would replace the whole list.
// It needs only write_products, which the app already has. fileCreate would also need write_files,
// and every store would have to reconnect to grant it.
const ADD_PRODUCT_IMAGE_MUTATION = /* GraphQL */ `
  mutation AddProductImage($product: ProductUpdateInput!, $media: [CreateMediaInput!]) {
    productUpdate(product: $product, media: $media) {
      product {
        # productUpdate does not return the media it created, so ask for the newest one instead.
        # Sorted by ID, not position, so it still works if the merchant has reordered the images.
        media(first: 1, sortKey: ID, reverse: true) {
          nodes {
            id
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

type AddProductImageResult = {
  productUpdate: {
    product: { media: { nodes: { id: string }[] } } | null;
    userErrors: { field: string[] | null; message: string }[];
  };
};

// Shopify downloads and processes the image after productUpdate returns. Processing a few MB usually
// takes a few seconds; after this long we give up rather than keep the user waiting.
const STATUS_POLL_INTERVAL_MS = 2000;
const STATUS_POLL_ATTEMPTS = 10;

const MEDIA_STATUS_QUERY = /* GraphQL */ `
  query MediaStatus($id: ID!) {
    node(id: $id) {
      ... on MediaImage {
        status
        mediaErrors {
          code
          message
          details
        }
      }
    }
  }
`;

type MediaStatusResult = {
  node: {
    status?: "UPLOADED" | "PROCESSING" | "READY" | "FAILED";
    mediaErrors?: { code: string; message: string; details: string | null }[];
  } | null;
};

// productDeleteMedia is deprecated in 2026-10 ("Use fileUpdate instead"), but it is the only way to remove
// product media with write_products alone. fileUpdate and fileDelete need write_files, and fileUpdate
// only accepts files that are READY, which a failed image never becomes.
const DELETE_PRODUCT_MEDIA_MUTATION = /* GraphQL */ `
  mutation DeleteProductMedia($productId: ID!, $mediaIds: [ID!]!) {
    productDeleteMedia(productId: $productId, mediaIds: $mediaIds) {
      deletedMediaIds
      mediaUserErrors {
        message
      }
    }
  }
`;

type DeleteProductMediaResult = {
  productDeleteMedia: {
    deletedMediaIds: string[] | null;
    mediaUserErrors: { message: string }[];
  };
};

/** Hosts Shopify's servers cannot reach, because they point at the machine the request comes from. */
const LOCAL_HOSTNAMES = ["localhost", "127.0.0.1", "[::1]"];

/**
 * Adds an image to a product, after its existing images, and waits until Shopify has processed it.
 * Shopify downloads the image from `imageUrl` itself, so the URL must be reachable from the internet.
 * Returns the new media's ID, e.g. "gid://shopify/MediaImage/123".
 * Throws if Shopify rejects the image, fails to process it, or takes too long. In the last two cases the
 * broken image is removed from the product again, so nothing half-finished is left in the store.
 */
export async function addProductImage(
  shopDomain: string,
  productId: string,
  imageUrl: string,
  alt: string,
): Promise<string> {
  // With local Supabase, Shopify would try to download from its own machine and fail a few seconds later.
  // Stop here instead, so no broken image is added to the store.
  if (LOCAL_HOSTNAMES.includes(new URL(imageUrl).hostname)) {
    throw new Error(
      `Shopify cannot download from ${new URL(imageUrl).host}. To test the upload, point SUPABASE_URL and SUPABASE_SECRET_KEY at the cloud project.`,
    );
  }

  const data = await shopifyAdminFetch<AddProductImageResult>(shopDomain, ADD_PRODUCT_IMAGE_MUTATION, {
    product: { id: productId },
    media: [{ originalSource: imageUrl, alt, mediaContentType: "IMAGE" }],
  });

  // Shopify reports problems with the input here with HTTP 200, so shopifyAdminFetch does not throw for them.
  const { product, userErrors } = data.productUpdate;
  if (userErrors.length > 0) {
    throw new Error(`Shopify rejected the image: ${userErrors.map((e) => e.message).join("; ")}`);
  }

  // Known limit: if two images are added to the same product at the same moment, this may return the other one.
  const mediaId = product?.media.nodes[0]?.id;
  if (!mediaId) throw new Error(`Shopify added no image to ${productId}`);

  // The mutation only means Shopify received the request. The image is not usable until it is READY.
  try {
    await waitUntilReady(shopDomain, mediaId);
  } catch (e) {
    try {
      await removeProductImage(shopDomain, productId, mediaId);
    } catch (deleteError) {
      console.error(`Could not remove the failed image ${mediaId} from ${productId}. Remove it in Shopify admin:`, deleteError);
    }
    throw e;
  }

  return mediaId;
}

/** Checks the media's status until it is READY. Throws if it FAILED or is still processing after the last check. */
async function waitUntilReady(shopDomain: string, mediaId: string): Promise<void> {
  for (let attempt = 1; attempt <= STATUS_POLL_ATTEMPTS; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, STATUS_POLL_INTERVAL_MS));

    const { node } = await shopifyAdminFetch<MediaStatusResult>(shopDomain, MEDIA_STATUS_QUERY, { id: mediaId });
    if (node?.status === "READY") return;
    if (node?.status === "FAILED") {
      const reasons = node.mediaErrors?.map((e) => `${e.code}: ${e.message}${e.details ? ` (${e.details})` : ""}`);
      throw new Error(`Shopify could not process ${mediaId}: ${reasons?.join("; ") || "no reason given"}`);
    }
  }

  const seconds = (STATUS_POLL_INTERVAL_MS * STATUS_POLL_ATTEMPTS) / 1000;
  throw new Error(`Shopify had not finished processing ${mediaId} after ${seconds} seconds`);
}

/** Removes one image from a product, e.g. one added by addProductImage. Throws if Shopify refuses. */
export async function removeProductImage(shopDomain: string, productId: string, mediaId: string): Promise<void> {
  const data = await shopifyAdminFetch<DeleteProductMediaResult>(shopDomain, DELETE_PRODUCT_MEDIA_MUTATION, {
    productId,
    mediaIds: [mediaId],
  });
  const { deletedMediaIds, mediaUserErrors } = data.productDeleteMedia;
  if (mediaUserErrors.length > 0 || !deletedMediaIds?.includes(mediaId)) {
    throw new Error(`Shopify did not delete ${mediaId}: ${mediaUserErrors.map((e) => e.message).join("; ")}`);
  }
}
