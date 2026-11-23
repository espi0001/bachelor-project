'use server';
/**
 * Server action that generates one image of a given type for a product, from the product's first image,
 * and saves it in Supabase Storage with a row in generated_image.
 */

import { randomUUID } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { isImageType, type ImageType } from "@/lib/image-types";
import { generatePackshot } from "@/lib/photoroom/generate";
import { getProduct, productIdFromUrl, productUrlId } from "@/lib/shopify/products";
import {
  createSignedImageUrls,
  deleteGeneratedImage,
  uploadGeneratedImage,
} from "@/lib/supabase/storage";

export type GenerateImageResult =
  | {
      ok: true;
      /** The new generated_image row, so the dialog can approve or reject it. */
      imageId: string;
      /** Signed link to the generated file. */
      imageUrl: string;
      /** The Shopify image it was generated from, shown next to it for comparison. */
      sourceImageUrl: string;
    }
  | { ok: false; error: string };

const generators: Record<ImageType, (imageUrl: string) => ReturnType<typeof generatePackshot>> = {
  packshot: generatePackshot,
};

/** File extension per content type. Matches allowed_mime_types on the "generated-images" bucket. */
const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
};

/**
 * Generates one image and saves it. The browser only sends which product and which type;
 * the server checks access and finds the source image itself, because anything
 * sent from the browser can be changed.
 */
export async function generateImage(
  productUrlIdFromBrowser: string,
  type: ImageType,
): Promise<GenerateImageResult> {
  // 1. Validate input from the browser.
  if (!isImageType(type)) return { ok: false, error: "Unknown image type." };
  const productId = productIdFromUrl(String(productUrlIdFromBrowser));
  if (!productId) return { ok: false, error: "Invalid product." };

  let path: string;
  let imageId: string;
  let sourceImageUrl: string;
  try {
    // 2. Who is asking, and which store do they own?
    const { orgId } = await auth();
    if (!orgId) return { ok: false, error: "Select an organization first." };

    const [store] = await sql<{ id: string; shopify_domain: string }[]>`
      SELECT id, shopify_domain FROM store WHERE auth_org_id = ${orgId} LIMIT 1
    `;
    if (!store) return { ok: false, error: "No store connected." };

    // 3. The product must exist in this org's store. The source image URL comes from Shopify, not the browser.
    const product = await getProduct(store.shopify_domain, productId);
    if (!product) return { ok: false, error: "The product was not found in your store." };

    const source = product.images[0];
    if (!source) return { ok: false, error: "The product has no images to generate from." };
    sourceImageUrl = source.url;

    // 4. Generate.
    const result = await generators[type](source.url);

    // 5. Save the file. The path starts with the store, and the random name means it cannot be guessed.
    // A content type can carry extra parameters (e.g. "image/png; charset=binary"); only the first part counts.
    const contentType = result.contentType.split(";")[0].trim().toLowerCase();
    const extension = EXTENSIONS[contentType];
    if (!extension) throw new Error(`Photoroom returned an unsupported content type: ${result.contentType}`);

    path = `${store.id}/${productUrlId(product.id)}/${randomUUID()}.${extension}`;
    await uploadGeneratedImage(path, result.data, contentType);

    // 6. Save the row. If that fails, delete the file again so no file is left without a row.
    try {
      const [row] = await sql<{ id: string }[]>`
        INSERT INTO generated_image
          (store_id, shopify_product_id, type, source_image_id, source_image_url, storage_path)
        VALUES
          (${store.id}, ${product.id}, ${type}, ${source.id}, ${source.url}, ${path})
        RETURNING id
      `;
      imageId = row.id;
    } catch (insertError) {
      try {
        await deleteGeneratedImage(path);
      } catch (deleteError) {
        console.error(`Could not delete ${path} after the insert failed. The file has no row:`, deleteError);
      }
      throw insertError;
    }
  } catch (e) {
    // Details go to the server log only; the user gets a short message.
    console.error(`Generating ${type} for ${productId} failed:`, e);
    return { ok: false, error: "The image could not be generated. Try again." };
  }

  // 7. The image is saved. A signed link lets the browser show it from the private bucket.
  try {
    const url = (await createSignedImageUrls([path])).get(path);
    if (!url) throw new Error(`No signed link returned for ${path}`);
    return { ok: true, imageId, imageUrl: url, sourceImageUrl };
  } catch (e) {
    console.error(`Signing ${path} failed:`, e);
    return { ok: false, error: "The image was saved, but its preview could not be loaded." };
  }
}
