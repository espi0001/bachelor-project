/**
 * Approval page: lists every generated image in the active org's store that is still a draft,
 * or approved but not yet uploaded to Shopify, ready to approve, retry or reject.
 */

import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { IMAGE_TYPE_LABELS, isImageType } from "@/lib/image-types";
import { ShopifyAuthError } from "@/lib/shopify/client";
import { getProductTitles } from "@/lib/shopify/products";
import { createSignedImageUrls } from "@/lib/supabase/storage";
import { ApprovalCard } from "@/components/approval-card";
import { UPLOAD_TIMEOUT } from "./upload-timeout";
import { PageHeader } from "@/components/page-header";
import { ConnectStorePrompt } from "@/components/connect-store-prompt";
import { getStoreForOrg } from "@/lib/store";

export const metadata = {
  title: "Approval",
};

export default function ApprovalPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Approval" description="Approve or reject AI images before they go to your store." />
      <Suspense fallback={<p className="text-secondary dark:text-zinc-400">Loading…</p>}>
        <ApprovalContent />
      </Suspense>
    </div>
  );
}

type DraftImage = {
  id: string;
  shopify_product_id: string;
  type: string;
  source_image_url: string;
  storage_path: string;
  /** True for an approved image that is being uploaded to Shopify right now. */
  uploading: boolean;
  /** True for an approved image whose upload to Shopify failed (or crashed). */
  upload_failed: boolean;
};

// auth() and the DB read are per request, so they must render inside Suspense (cacheComponents).
async function ApprovalContent() {
  const { orgId } = await auth.protect();
  if (!orgId) {
    return <p className="text-secondary dark:text-zinc-400">Select an organization first.</p>;
  }

  // Each Clerk organization only sees its own store.
  const store = await getStoreForOrg(orgId);
  if (!store) {
    return <ConnectStorePrompt description="Connect your store to see images waiting for approval" />;
  }

  // The join on auth_org_id is the org check itself, not only the store lookup above.
  // An approved image without a media ID is uploading (started less than UPLOAD_TIMEOUT ago) or failed;
  // it stays here until it is in Shopify or rejected. Failed uploads come first, so they are not missed
  // below a long list of drafts.
  const drafts = await sql<DraftImage[]>`
    SELECT gi.id, gi.shopify_product_id, gi.type, gi.source_image_url, gi.storage_path, uploading,
           gi.status = 'approved' AND NOT uploading AS upload_failed
    FROM generated_image gi
    CROSS JOIN LATERAL (
      SELECT coalesce(gi.upload_started_at > now() - ${UPLOAD_TIMEOUT}::interval, false) AS uploading
    ) u
    JOIN store s ON s.id = gi.store_id
    WHERE s.auth_org_id = ${orgId}
      AND (gi.status = 'draft' OR (gi.status = 'approved' AND gi.shopify_media_id IS NULL))
    ORDER BY upload_failed DESC, gi.created_at DESC
  `;

  if (drafts.length === 0) {
    return (
      <p className="text-secondary">
        No images are waiting for approval.{" "}
        <Link href="/products" className="underline">
          Generate images from a product
        </Link>
        .
      </p>
    );
  }

  let titles: Map<string, string>;
  try {
    titles = await getProductTitles(
      store.shopify_domain,
      drafts.map((d) => d.shopify_product_id),
    );
  } catch (e) {
    if (!(e instanceof ShopifyAuthError)) throw e;
    return (
      <p className="text-secondary">
        Shopify no longer accepts the connection to {store.shopify_domain}. The app may have been uninstalled.{" "}
        <Link href="/connect-store?reconnect=1" className="underline">
          Reconnect the store
        </Link>
        .
      </p>
    );
  }

  const imageUrls = await createSignedImageUrls(drafts.map((d) => d.storage_path));

  return (
    <ul className="flex flex-col gap-4">
      {drafts.map((draft) => (
        <li key={draft.id}>
          <ApprovalCard
            imageId={draft.id}
            uploading={draft.uploading}
            uploadFailed={draft.upload_failed}
            // The type column is checked in the app, not the database, so an unknown value is shown as-is.
            typeLabel={isImageType(draft.type) ? IMAGE_TYPE_LABELS[draft.type] : draft.type}
            productTitle={titles.get(draft.shopify_product_id) ?? null}
            originalUrl={draft.source_image_url}
            generatedUrl={imageUrls.get(draft.storage_path) ?? null}
          />
        </li>
      ))}
    </ul>
  );
}
