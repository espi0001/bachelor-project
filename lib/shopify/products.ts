import "server-only";
import { shopifyAdminFetch } from "./client";

export type ProductImage = {
  id: string;
  url: string;
  altText: string | null;
  /** Pixels. Null if Shopify hasn't finished processing the image yet. */
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
const IMAGES_PER_PRODUCT = 50;

const PRODUCTS_QUERY = /* GraphQL */ `
  query Products($first: Int!, $after: String, $imagesFirst: Int!) {
    products(first: $first, after: $after, sortKey: TITLE) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
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
    }
  }
`;

type ProductsQueryResult = {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: {
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
    }[];
  };
};

/** Fetches every product in the store with its images (URL and dimensions). */
export async function getProducts(): Promise<Product[]> {
  const products: Product[] = [];
  let after: string | null = null;

  do {
    const data: ProductsQueryResult = await shopifyAdminFetch<ProductsQueryResult>(
      PRODUCTS_QUERY,
      { first: PRODUCTS_PAGE_SIZE, after, imagesFirst: IMAGES_PER_PRODUCT },
    );

    for (const node of data.products.nodes) {
      products.push({
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
      });
    }

    after = data.products.pageInfo.hasNextPage
      ? data.products.pageInfo.endCursor
      : null;
  } while (after);

  return products;
}
