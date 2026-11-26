/**
 * Fetches products and their images from a Shopify store via the Admin API: all products, or one by ID.
 */

import "server-only";
import { shopifyAdminFetch } from "./client";

export type ProductImage = {
  id: string;
  url: string;
  altText: string | null;
  /** Pixels. Null when Shopify does not host the image, so the size is unknown. */
  width: number | null;
  height: number | null;
};

export type Product = {
  id: string;
  title: string;
  handle: string;
  status: "ACTIVE" | "ARCHIVED" | "DRAFT" | "UNLISTED";
  images: ProductImage[];
};

const PRODUCTS_PAGE_SIZE = 50;
// Shopify allows at most 250 media per product, and 250 is also the max page size, so the
// single-product query gets every image in one request without paginating.
const IMAGES_PER_PRODUCT = 250;
// The list stays lower: Shopify rejects queries whose estimated cost is over 1,000 points, and the
// estimate multiplies products by media. Images after the first 50 are not returned.
const IMAGES_PER_PRODUCT_IN_LIST = 50;

const PRODUCT_GID_PREFIX = "gid://shopify/Product/";

/** "gid://shopify/Product/8123456789" → "8123456789", the part we use in URLs. */
export function productUrlId(productId: string): string {
  return productId.slice(PRODUCT_GID_PREFIX.length);
}

/** "8123456789" → "gid://shopify/Product/8123456789". Returns null if the URL value isn't a plain number. */
export function productIdFromUrl(urlId: string): string | null {
  return /^\d+$/.test(urlId) ? `${PRODUCT_GID_PREFIX}${urlId}` : null;
}

// The fields we read for every product, shared by the list and single-product queries
// so both always return the same data.
const PRODUCT_FIELDS = /* GraphQL */ `
  fragment ProductFields on Product {
    id
    title
    handle
    status
    media(first: $imagesFirst) {
      nodes {
        ... on MediaImage {
          id
          alt
          image {
            url
            width
            height
          }
        }
      }
    }
  }
`;

const PRODUCTS_QUERY = /* GraphQL */ `
  ${PRODUCT_FIELDS}
  query Products($first: Int!, $after: String, $imagesFirst: Int!) {
    products(first: $first, after: $after, sortKey: TITLE) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ...ProductFields
      }
    }
  }
`;

const PRODUCT_QUERY = /* GraphQL */ `
  ${PRODUCT_FIELDS}
  query Product($id: ID!, $imagesFirst: Int!) {
    product(id: $id) {
      ...ProductFields
    }
  }
`;

/** A product as Shopify returns it, before we flatten it into our Product type. */
type ProductNode = {
  id: string;
  title: string;
  handle: string;
  status: Product["status"];
  media: {
    nodes: {
      // Empty object for non-image media (video, 3D models).
      id?: string;
      alt?: string | null;
      image?: { url: string; width: number | null; height: number | null } | null;
    }[];
  };
};

type ProductsQueryResult = {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: ProductNode[];
  };
};

type ProductQueryResult = { product: ProductNode | null };

/** Flattens Shopify's nested media into a plain list of images and drops videos and 3D models. */
function toProduct(node: ProductNode): Product {
  return {
    id: node.id,
    title: node.title,
    handle: node.handle,
    status: node.status,
    images: node.media.nodes.flatMap((media) =>
      media.id && media.image
        ? [
            {
              id: media.id,
              url: media.image.url,
              altText: media.alt ?? null,
              width: media.image.width,
              height: media.image.height,
            },
          ]
        : [],
    ),
  };
}

/** Fetches every product in the store with its images (URL and dimensions). */
export async function getProducts(shopDomain: string): Promise<Product[]> {
  const products: Product[] = [];
  let after: string | null = null;

  do {
    const data: ProductsQueryResult = await shopifyAdminFetch<ProductsQueryResult>(
      shopDomain,
      PRODUCTS_QUERY,
      { first: PRODUCTS_PAGE_SIZE, after, imagesFirst: IMAGES_PER_PRODUCT_IN_LIST },
    );

    products.push(...data.products.nodes.map(toProduct));

    after = data.products.pageInfo.hasNextPage
      ? data.products.pageInfo.endCursor
      : null;
  } while (after);

  return products;
}

/**
 * Fetches one product by its Shopify ID (e.g. "gid://shopify/Product/8123456789").
 * Returns null if the product doesn't exist in this store.
 */
export async function getProduct(shopDomain: string, productId: string): Promise<Product | null> {
  const data = await shopifyAdminFetch<ProductQueryResult>(shopDomain, PRODUCT_QUERY, {
    id: productId,
    imagesFirst: IMAGES_PER_PRODUCT,
  });
  return data.product ? toProduct(data.product) : null;
}
