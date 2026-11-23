/**
 * Approval page: lists every generated image in the active org's store that is still a draft, ready to approve or reject.
 */

import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { IMAGE_TYPE_LABELS, isImageType } from "@/lib/image-types";
import { ShopifyAuthError } from "@/lib/shopify/client";
import { getProductTitles } from "@/lib/shopify/products";
import { createSignedImageUrls } from "@/lib/supabase/storage";
import { ApprovalCard } from "./approval-card";

export const metadata = {
  title: "Approval",
};

type DraftImage = {
  id: string;
  shopify_product_id: string;
  type: string;
  source_image_url: string;
  storage_path: string;
};

export default function ApprovalPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="mb-6 typography-heading-page text-primary">Approval</h1>
      <Suspense fallback={<p className="text-secondary">Loading images…</p>}>
        <DraftList />
      </Suspense>
    </main>
  );
}

async function DraftList() {
  // Only signed-in users may see store data.
  await auth.protect();

  // Each Clerk organization only sees its own store.
  const { orgId } = await auth();
  if (!orgId) {
    return <p className="text-secondary">Select an organization first.</p>;
  }

  const [store] = await sql<{ id: string; shopify_domain: string }[]>`
    SELECT id, shopify_domain FROM store WHERE auth_org_id = ${orgId} LIMIT 1
  `;
  if (!store) {
    return (
      <p className="text-secondary">
        No store connected.{" "}
        <Link href="/connect-store" className="underline">
          Connect a store
        </Link>
        .
      </p>
    );
  }

  // The join on auth_org_id is the org check itself, not only the store lookup above.
  const drafts = await sql<DraftImage[]>`
    SELECT gi.id, gi.shopify_product_id, gi.type, gi.source_image_url, gi.storage_path
    FROM generated_image gi
    JOIN store s ON s.id = gi.store_id
    WHERE s.auth_org_id = ${orgId} AND gi.status = 'draft'
    ORDER BY gi.created_at DESC
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
