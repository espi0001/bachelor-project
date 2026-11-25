/** Settings page: tabs for the store connection, the organization's members and the visual tone of voice. */

import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { ConnectStorePrompt } from "@/components/connect-store-prompt";
import { StoreConnectionCard } from "./store-connection-card";
import { OrganizationCard } from "./organization-card";
import { SettingsCard } from "./settings-card";
import { SettingsTabs } from "./settings-tabs";

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
        <SettingsContent />
      </Suspense>
    </div>
  );
}

// auth() and the DB read are per request, so they must render inside Suspense (cacheComponents).
async function SettingsContent() {
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

  return (
    <SettingsTabs
      tabs={[
        {
          id: "store-connection",
          label: "Store connection",
          content: (
            <StoreConnectionCard
              storeId={store.id}
              shopDomain={store.shopify_domain}
              lastSyncedAt={store.last_synced_at}
            />
          ),
        },
        { id: "organization", label: "Organization", content: <OrganizationCard orgId={orgId} /> },
        {
          id: "visual-tone-of-voice",
          label: "Visual tone of voice",
          // Placeholder until the style from a reference image is built (BA-148).
          content: (
            <SettingsCard
              title="Visual tone of voice"
              description="Upload a reference image, and AI turns its light, colours and mood into a style for your AI images."
            >
              <p className="typography-body-sm text-muted dark:text-zinc-500">Coming soon.</p>
            </SettingsCard>
          ),
        },
      ]}
    />
  );
}
