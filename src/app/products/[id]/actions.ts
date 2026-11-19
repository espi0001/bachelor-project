'use server';
/**
 * Server action that generates one image of a given type for a product, from the product's first image.
 */

import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { isImageType, type ImageType } from "@/lib/image-types";
import { generatePackshot } from "@/lib/photoroom/generate";
import { getProduct, productIdFromUrl } from "@/lib/shopify/products";

export type GenerateImageResult =
  | { ok: true; dataUrl: string }
  | { ok: false; error: string };

const generators: Record<ImageType, (imageUrl: string) => ReturnType<typeof generatePackshot>> = {
  packshot: generatePackshot,
};

/**
 * Generates one image. The browser only sends which product and which type;
 * the server checks access and finds the source image itself, because anything
 * sent from the browser can be changed.
 */
export async function generateImage(
  productUrlId: string,
  type: ImageType,
): Promise<GenerateImageResult> {
  // 1. Who is asking, and which store do they own?
  const { orgId } = await auth();
  if (!orgId) return { ok: false, error: "Select an organization first." };

  const [store] = await sql<{ shopify_domain: string }[]>`
    SELECT shopify_domain FROM store WHERE auth_org_id = ${orgId} LIMIT 1
  `;
  if (!store) return { ok: false, error: "No store connected." };

  // 2. Validate input from the browser.
  if (!isImageType(type)) return { ok: false, error: "Unknown image type." };
  const productId = productIdFromUrl(String(productUrlId));
  if (!productId) return { ok: false, error: "Invalid product." };

  try {
    // 3. The product must exist in this org's store. The source image URL comes from Shopify, not the browser.
    const product = await getProduct(store.shopify_domain, productId);
    if (!product) return { ok: false, error: "The product was not found in your store." };

    const source = product.images[0];
    if (!source) return { ok: false, error: "The product has no images to generate from." };

    // 4. Generate. Not saved yet: the image goes straight back to the browser as a data URL.
    const result = await generators[type](source.url);
    return {
      ok: true,
      dataUrl: `data:${result.contentType};base64,${result.data.toString("base64")}`,
    };
  } catch (e) {
    // Details go to the server log only; the user gets a short message.
    console.error(`Generating ${type} for ${productId} failed:`, e);
    return { ok: false, error: "The image could not be generated. Try again." };
  }
}
