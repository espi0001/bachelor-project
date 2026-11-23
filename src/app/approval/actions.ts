'use server';
/** Server actions for the approval page: reject a draft image. */

import { refresh } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";

export type ApprovalResult = { ok: true } | { ok: false; error: string };

/**
 * Marks a draft image as rejected. The file stays in Storage, so the decision can be looked up later.
 * The image ID comes from the browser, so the update only matches an image in the org's own store.
 */
export async function rejectImage(imageIdFromBrowser: string): Promise<ApprovalResult> {
  // 1. Validate input from the browser. IDs are bigint, so only plain numbers are valid.
  const imageId = String(imageIdFromBrowser);
  if (!/^\d+$/.test(imageId)) return { ok: false, error: "Invalid image." };

  try {
    // 2. Who is asking?
    const { orgId } = await auth();
    if (!orgId) return { ok: false, error: "Select an organization first." };

    // 3. One statement checks access and updates, so nothing can change in between.
    // Only drafts can be rejected: an image that is already approved may be in Shopify.
    const updated = await sql<{ id: string }[]>`
      UPDATE generated_image gi
      SET status = 'rejected'
      FROM store s
      WHERE gi.id = ${imageId}
        AND gi.store_id = s.id
        AND s.auth_org_id = ${orgId}
        AND gi.status = 'draft'
      RETURNING gi.id
    `;

    // Wrong ID, another org's image, or already handled: the user gets the same answer for all three,
    // so the message does not reveal whether an ID exists in another store.
    if (updated.length === 0) {
      return { ok: false, error: "The image was not found or has already been handled." };
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
