'use server';
/**
 * Server actions for the approval page: approve a draft image and upload it to Shopify,
 * retry a failed upload, or reject an image.
 */

import { refresh } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { IMAGE_TYPE_LABELS, isImageType } from "@/lib/image-types";
import { ShopifyAuthError } from "@/lib/shopify/client";
import { addProductImage } from "@/lib/shopify/media";
import { getProductTitles } from "@/lib/shopify/products";
import { createSignedImageUrls } from "@/lib/supabase/storage";
import { UPLOAD_TIMEOUT } from "./upload-timeout";

export type ApprovalResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      /** True if the image was approved but is not in Shopify, so the card should offer Retry. */
      uploadFailed?: boolean;
    };

/** What the upload needs to know about an image and its store. */
type ImageToUpload = {
  shopify_product_id: string;
  type: string;
  storage_path: string;
  shopify_domain: string;
};

/** IDs are bigint, so only plain numbers are valid. */
function isImageId(value: string): boolean {
  return /^\d+$/.test(value);
}

/**
 * Approves a draft image and adds it to its product in Shopify.
 * If the upload fails, the image stays approved without a Shopify media ID, so it can be retried.
 */
export async function approveImage(imageIdFromBrowser: string): Promise<ApprovalResult> {
  // 1. Validate input from the browser.
  const imageId = String(imageIdFromBrowser);
  if (!isImageId(imageId)) return { ok: false, error: "Invalid image." };

  // 2. Who is asking?
  const { orgId } = await auth();
  if (!orgId) return { ok: false, error: "Select an organization first." };

  // 3. Approve and mark the upload as started. Only one request can move an image out of 'draft', so a double
  // click or a second tab cannot upload the same image twice. The join is the org check.
  let image: ImageToUpload;
  try {
    const [approved] = await sql<ImageToUpload[]>`
      UPDATE generated_image gi
      SET status = 'approved', upload_started_at = now()
      FROM store s
      WHERE gi.id = ${imageId}
        AND gi.store_id = s.id
        AND s.auth_org_id = ${orgId}
        AND gi.status = 'draft'
      RETURNING gi.shopify_product_id, gi.type, gi.storage_path, s.shopify_domain
    `;
    if (!approved) return { ok: false, error: "The image was not found or has already been handled." };
    image = approved;
  } catch (e) {
    console.error(`Approving image ${imageId} failed:`, e);
    return { ok: false, error: "The image could not be approved. Try again." };
  }

  // 4. Upload. From here on the image is approved, whatever happens to the upload.
  const result = await uploadToShopify(imageId, orgId, image);

  // 5. Load the page again, also when the upload failed: the row is no longer a draft, so the card
  // must change to "Upload failed" with Retry now, not only after a reload.
  refresh();
  return result;
}

/** Uploads an approved image again after an earlier upload failed. */
export async function retryUpload(imageIdFromBrowser: string): Promise<ApprovalResult> {
  // 1. Validate input from the browser.
  const imageId = String(imageIdFromBrowser);
  if (!isImageId(imageId)) return { ok: false, error: "Invalid image." };

  // 2. Who is asking?
  const { orgId } = await auth();
  if (!orgId) return { ok: false, error: "Select an organization first." };

  // 3. Mark the upload as started, if the image is approved, not in Shopify, and not being uploaded right now
  // (or that upload crashed). One statement checks and claims, so two retries at once cannot both upload.
  // The join is the org check.
  let image: ImageToUpload;
  try {
    const [failed] = await sql<ImageToUpload[]>`
      UPDATE generated_image gi
      SET upload_started_at = now()
      FROM store s
      WHERE gi.id = ${imageId}
        AND gi.store_id = s.id
        AND s.auth_org_id = ${orgId}
        AND gi.status = 'approved'
        AND gi.shopify_media_id IS NULL
        AND (gi.upload_started_at IS NULL OR gi.upload_started_at < now() - ${UPLOAD_TIMEOUT}::interval)
      RETURNING gi.shopify_product_id, gi.type, gi.storage_path, s.shopify_domain
    `;
    if (!failed) {
      return { ok: false, error: "The image was not found, is being uploaded, or has already been uploaded." };
    }
    image = failed;
  } catch (e) {
    console.error(`Starting the retry of image ${imageId} failed:`, e);
    return { ok: false, error: "The upload could not be retried. Try again." };
  }

  const result = await uploadToShopify(imageId, orgId, image);

  // 4. Load the page again, so the card disappears on success, or shows the latest state on failure.
  refresh();
  return result;
}

/**
 * Adds an approved image to its product in Shopify and records the upload. Shared by approve and retry.
 * Callers have already checked that the image belongs to the org and marked the upload as started.
 * The queries here still filter on the org, so they stay safe if a new caller forgets that check.
 * If the upload fails, the mark is removed again, so the image can be retried or rejected straight away.
 */
async function uploadToShopify(imageId: string, orgId: string, image: ImageToUpload): Promise<ApprovalResult> {
  const result = await tryUpload(imageId, orgId, image);
  if (!result.ok) await releaseUpload(imageId, orgId);
  return result;
}

/** Removes the "upload started" mark. If that fails, the image becomes retryable after UPLOAD_TIMEOUT instead. */
async function releaseUpload(imageId: string, orgId: string): Promise<void> {
  try {
    await sql`
      UPDATE generated_image gi
      SET upload_started_at = NULL
      FROM store s
      WHERE gi.id = ${imageId}
        AND gi.store_id = s.id
        AND s.auth_org_id = ${orgId}
    `;
  } catch (e) {
    console.error(`Could not clear upload_started_at on image ${imageId}. It can be retried after ${UPLOAD_TIMEOUT}:`, e);
  }
}

async function tryUpload(imageId: string, orgId: string, image: ImageToUpload): Promise<ApprovalResult> {
  // 1. Upload.
  let mediaId: string;
  try {
    const titles = await getProductTitles(image.shopify_domain, [image.shopify_product_id]);
    const title = titles.get(image.shopify_product_id);
    if (!title) return { ok: false, error: "Approved, but the product no longer exists in Shopify.", uploadFailed: true };

    // Shopify downloads the file itself from this link while addProductImage waits. It is valid for an hour.
    const url = (await createSignedImageUrls([image.storage_path])).get(image.storage_path);
    if (!url) throw new Error(`No signed link returned for ${image.storage_path}`);

    // BA-153: the alt text says the image is AI-generated, so shoppers and screen reader users can tell.
    const typeLabel = isImageType(image.type) ? IMAGE_TYPE_LABELS[image.type] : image.type;
    mediaId = await addProductImage(
      image.shopify_domain,
      image.shopify_product_id,
      url,
      `${typeLabel} of ${title}. Generated with AI.`,
    );
  } catch (e) {
    console.error(`Uploading image ${imageId} to Shopify failed:`, e);
    if (e instanceof ShopifyAuthError) {
      return {
        ok: false,
        error: "Approved, but Shopify no longer accepts the connection. Reconnect the store.",
        uploadFailed: true,
      };
    }
    return { ok: false, error: "Approved, but the upload to Shopify failed.", uploadFailed: true };
  }

  // 2. Record the upload.
  try {
    const updated = await sql`
      UPDATE generated_image gi
      SET shopify_media_id = ${mediaId}, uploaded_at = now(), upload_started_at = NULL
      FROM store s
      WHERE gi.id = ${imageId}
        AND gi.store_id = s.id
        AND s.auth_org_id = ${orgId}
    `;
    // Should not happen, since the caller claimed this row. Treated like a failed save rather than ignored.
    if (updated.count === 0) throw new Error(`No row matched image ${imageId} in org ${orgId}`);
  } catch (e) {
    // The image is in Shopify, but the database does not know. A retry would add it twice.
    console.error(`Image ${imageId} is in Shopify as ${mediaId}, but saving that failed:`, e);
    // Still reported as a failed upload: the row has no media ID, so /approval shows it with Retry too.
    return {
      ok: false,
      error: "The image was uploaded, but saving that failed. Check Shopify before retrying.",
      uploadFailed: true,
    };
  }

  // The callers refresh the page, whatever the result.
  return { ok: true };
}

/**
 * Rejects a draft image, or an approved image whose upload failed (it is not in Shopify, so nothing needs undoing).
 * An image that is being uploaded cannot be rejected: it may be in Shopify a few seconds later.
 * The file stays in Storage, so the decision can be looked up later.
 * The image ID comes from the browser, so the update only matches an image in the org's own store.
 */
export async function rejectImage(imageIdFromBrowser: string): Promise<ApprovalResult> {
  // 1. Validate input from the browser.
  const imageId = String(imageIdFromBrowser);
  if (!isImageId(imageId)) return { ok: false, error: "Invalid image." };

  try {
    // 2. Who is asking?
    const { orgId } = await auth();
    if (!orgId) return { ok: false, error: "Select an organization first." };

    // 3. One statement checks access and updates, so nothing can change in between.
    // An image that is already in Shopify, or being uploaded, cannot be rejected here.
    // A crashed upload's mark is cleared, because only approved images may have one.
    const updated = await sql<{ id: string }[]>`
      UPDATE generated_image gi
      SET status = 'rejected', upload_started_at = NULL
      FROM store s
      WHERE gi.id = ${imageId}
        AND gi.store_id = s.id
        AND s.auth_org_id = ${orgId}
        AND (
          gi.status = 'draft'
          OR (
            gi.status = 'approved'
            AND gi.shopify_media_id IS NULL
            AND (gi.upload_started_at IS NULL OR gi.upload_started_at < now() - ${UPLOAD_TIMEOUT}::interval)
          )
        )
      RETURNING gi.id
    `;

    // Wrong ID, another org's image, uploading or already handled: the user gets the same answer for all,
    // so the message does not reveal whether an ID exists in another store.
    if (updated.length === 0) {
      return { ok: false, error: "The image was not found, is being uploaded, or has already been handled." };
    }
  } catch (e) {
    // Details go to the server log only; the user gets a short message.
    console.error(`Rejecting image ${imageId} failed:`, e);
    return { ok: false, error: "The image could not be rejected. Try again." };
  }

  // 4. Load the page again, so the rejected card disappears.
  refresh();
  return { ok: true };
}
