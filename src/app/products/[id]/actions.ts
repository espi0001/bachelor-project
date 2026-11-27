'use server';
/**
 * Server actions for the generate dialog: create an upload link for a source image from the user's device, and
 * generate one image from a source image and save it in Supabase Storage with a row in generated_image.
 */

import { randomUUID } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { isImageType, type ImageType } from "@/lib/image-types";
import { generateLifestyleImage, generatePackshot } from "@/lib/photoroom/generate";
import type { PhotoroomResult } from "@/lib/photoroom/client";
import { downloadShopifyImage } from "@/lib/shopify/images";
import { getProduct, productIdFromUrl, productUrlId } from "@/lib/shopify/products";
import {
  isSourceImageChoice,
  isSourceImageContentType,
  SOURCE_IMAGE_EXTENSIONS,
  SOURCE_IMAGE_MAX_BYTES,
  type SourceImageChoice,
} from "@/lib/source-image";
import {
  createSignedImageUrls,
  createSignedSourceImageUrls,
  createSourceImageUploadUrl,
  deleteGeneratedImage,
  downloadSourceImage,
  uploadGeneratedImage,
} from "@/lib/supabase/storage";

export type GenerateImageResult =
  | {
      ok: true;
      /** The new generated_image row, so the dialog can approve or reject it. */
      imageId: string;
      /** Signed link to the generated file. */
      imageUrl: string;
      /** The source image it was generated from, shown next to it for comparison. */
      sourceImageUrl: string;
    }
  | { ok: false; error: string };

export type SourceImageUploadResult =
  | {
      ok: true;
      /** Where the file goes in the "source-images" bucket. Sent back to generateImage as the source. */
      path: string;
      /** The browser PUTs the file to this link. */
      uploadUrl: string;
    }
  | { ok: false; error: string };

type Generator = (image: Blob, visualToneOfVoice: string | null) => Promise<PhotoroomResult>;

// Only lifestyle images use the visual tone of voice. A packshot must look neutral, whatever the store's style.
const generators: Record<ImageType, Generator> = {
  packshot: generatePackshot,
  lifestyleImage: generateLifestyleImage,
};

/** File extension per content type. Matches allowed_mime_types on the "generated-images" bucket. */
const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
};

/**
 * Creates a link the browser uploads a source image from the user's device to. The server picks the path, under the
 * org's own store, so a file can never land in (or later be read from) another store's folder.
 */
export async function createSourceImageUpload(
  productUrlIdFromBrowser: string,
  contentTypeFromBrowser: string,
  sizeFromBrowser: number,
): Promise<SourceImageUploadResult> {
  // The browser checks these too, but anyone can call a server action directly. The bucket checks them again on upload.
  const productId = productIdFromUrl(String(productUrlIdFromBrowser));
  if (!productId) return { ok: false, error: "Invalid product." };
  if (!isSourceImageContentType(contentTypeFromBrowser)) {
    return { ok: false, error: "Choose a JPG, PNG or WebP image." };
  }
  if (typeof sizeFromBrowser !== "number" || !(sizeFromBrowser > 0) || sizeFromBrowser > SOURCE_IMAGE_MAX_BYTES) {
    return { ok: false, error: "The image must be 10 MB or smaller." };
  }

  try {
    const { orgId } = await auth();
    if (!orgId) return { ok: false, error: "Select an organization first." };

    const [store] = await sql<{ id: string }[]>`
      SELECT id FROM store WHERE auth_org_id = ${orgId} LIMIT 1
    `;
    if (!store) return { ok: false, error: "No store connected." };

    // No Shopify lookup here, to keep the upload quick: the path is inside this org's store either way,
    // and generateImage checks that the product exists before it uses the file.
    const extension = SOURCE_IMAGE_EXTENSIONS[contentTypeFromBrowser];
    const path = `${store.id}/${productUrlId(productId)}/${randomUUID()}.${extension}`;
    const uploadUrl = await createSourceImageUploadUrl(path);
    return { ok: true, path, uploadUrl };
  } catch (e) {
    console.error(`Creating a source image upload for ${productId} failed:`, e);
    return { ok: false, error: "The image could not be uploaded. Try again." };
  }
}

/**
 * Generates one image and saves it. The browser only sends which product, which type and which source image.
 * The server checks access and resolves the source itself (a Shopify image must be one of the product's images,
 * an upload must be in this store's folder for this product), because anything sent from the browser can be changed.
 */
export async function generateImage(
  productUrlIdFromBrowser: string,
  type: ImageType,
  sourceFromBrowser: SourceImageChoice,
): Promise<GenerateImageResult> {
  // 1. Validate input from the browser.
  if (!isImageType(type)) return { ok: false, error: "Unknown image type." };
  const productId = productIdFromUrl(String(productUrlIdFromBrowser));
  if (!productId) return { ok: false, error: "Invalid product." };
  if (!isSourceImageChoice(sourceFromBrowser)) return { ok: false, error: "Source image not found." };

  let path: string;
  let imageId: string;
  let sourceImageUrl: string;
  try {
    // 2. Who is asking, and which store do they own?
    const { orgId } = await auth();
    if (!orgId) return { ok: false, error: "Select an organization first." };

    const [store] = await sql<{ id: string; shopify_domain: string; visual_tone_of_voice: string | null }[]>`
      SELECT id, shopify_domain, visual_tone_of_voice FROM store WHERE auth_org_id = ${orgId} LIMIT 1
    `;
    if (!store) return { ok: false, error: "No store connected." };

    // 3. The product must exist in this org's store, and the source must belong to it.
    const product = await getProduct(store.shopify_domain, productId);
    if (!product) return { ok: false, error: "The product was not found in your store." };

    const source = await resolveSource(sourceFromBrowser, store.id, product);
    if (!source) return { ok: false, error: "Source image not found." };
    sourceImageUrl = source.previewUrl;

    // 4. Generate.
    const result = await generators[type](source.photoroomImage, store.visual_tone_of_voice);

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
          (store_id, shopify_product_id, type, source_image_id, source_image_url, source_storage_path, storage_path)
        VALUES
          (${store.id}, ${product.id}, ${type}, ${source.shopifyImageId}, ${source.shopifyImageUrl},
           ${source.storagePath}, ${path})
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

type ResolvedSource = {
  /** The source file, held in memory for this request only, sent to Photoroom. */
  photoroomImage: Blob;
  /** The link the dialog shows the source with, next to the generated image. */
  previewUrl: string;
  /** Saved in generated_image: the Shopify columns for a Shopify source, the storage path for an upload. */
  shopifyImageId: string | null;
  shopifyImageUrl: string | null;
  storagePath: string | null;
};

/** The shape of every path createSourceImageUpload makes: "{store_id}/{product number}/{uuid}.{ext}". */
const SOURCE_PATH_PATTERN = /^\d+\/\d+\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

/** Turns the browser's choice into links the server trusts. Returns null if the source does not belong to the product. */
async function resolveSource(
  choice: SourceImageChoice,
  storeId: string,
  product: { id: string; images: { id: string; url: string }[] },
): Promise<ResolvedSource | null> {
  if (choice.kind === "shopify") {
    // Only the ID comes from the browser; the URL comes from Shopify.
    const image = product.images.find((i) => i.id === choice.imageId);
    if (!image) return null;
    return {
      photoroomImage: await downloadShopifyImage(image.url),
      previewUrl: image.url,
      shopifyImageId: image.id,
      shopifyImageUrl: image.url,
      storagePath: null,
    };
  }

  // The folder is worked out here from auth() and Shopify, so a path into another store's folder is refused.
  // The pattern also rules out tricks like "..".
  const path = choice.path;
  if (!SOURCE_PATH_PATTERN.test(path) || !path.startsWith(`${storeId}/${productUrlId(product.id)}/`)) return null;

  // Signing also checks that the file exists: a missing file gets no link.
  const previewUrl = (await createSignedSourceImageUrls([path])).get(path);
  if (!previewUrl) return null;

  return {
    photoroomImage: await downloadSourceImage(path),
    previewUrl,
    shopifyImageId: null,
    shopifyImageUrl: null,
    storagePath: path,
  };
}
