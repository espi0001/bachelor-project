/** Settings page: the organization's store connection, AI rules, team and notifications in a grid of cards. */

import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { StoreConnectionCard } from "./store-connection-card";

export const metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Manage the store connection, the rules for AI images and who has access."
      />
      <Suspense fallback={<p className="text-secondary dark:text-zinc-400">Loading settings…</p>}>
        <SettingsCards />
      </Suspense>
    </div>
  );
}

// auth() and the DB read are per request, so they must render inside Suspense (cacheComponents).
async function SettingsCards() {
  const { orgId } = await auth.protect();
  if (!orgId) {
    return <p className="text-secondary dark:text-zinc-400">Select an organization first.</p>;
  }

  // Each Clerk organization only sees its own store.
  // id is a bigint, which postgres returns as a string.
  const [store] = await sql<{ id: string; shopify_domain: string; last_synced_at: Date | null }[]>`
    SELECT id, shopify_domain, last_synced_at FROM store WHERE auth_org_id = ${orgId} LIMIT 1
  `;
  if (!store) redirect("/connect-store");

  // Two columns as in Figma from lg up; the other cards (BA-184, BA-185) go in these columns.
  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <StoreConnectionCard
          storeId={store.id}
          shopDomain={store.shopify_domain}
          lastSyncedAt={store.last_synced_at}
        />
      </div>
    </div>
  );
}
