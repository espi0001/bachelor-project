/** Settings page: tabs for the store connection, the organization's members and the visual tone of voice. */

import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { getStoreForOrg } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { ConnectStorePrompt } from "@/components/connect-store-prompt";
import { ADMIN_ROLE } from "@/lib/roles";
import { StoreConnectionCard } from "./store-connection-card";
import { OrganizationCard } from "./organization-card";
import { SettingsCard } from "./settings-card";
import { SettingsTabs } from "./settings-tabs";
import { VisualToneOfVoiceForm } from "./visual-tone-of-voice-form";

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
  const { orgId, has } = await auth.protect();
  if (!orgId) {
    return <p className="text-secondary dark:text-zinc-400">Select an organization first.</p>;
  }

  // Each Clerk organization only sees its own store.
  const store = await getStoreForOrg(orgId);
  return (
    <SettingsTabs
      tabs={[
        {
          id: "store-connection",
          label: "Store connection",
          // The user may have skipped connecting a store; the other tabs work without one.
          content: store ? (
            <StoreConnectionCard
              storeId={store.id}
              shopDomain={store.shopify_domain}
              lastSyncedAt={store.last_synced_at}
              canDisconnect={has({ role: ADMIN_ROLE })}
            />
          ) : (
            <ConnectStorePrompt />
          ),
        },
        { id: "organization", label: "Organization", content: <OrganizationCard orgId={orgId} /> },
        {
          id: "visual-tone-of-voice",
          label: "Visual tone of voice",
          content: (
            <SettingsCard
              title="Visual tone of voice"
              description="How your lifestyle images should look. It is sent with every lifestyle image you generate."
            >
              {/* The text is saved on the store row, so it needs a connected store. */}
              {store ? (
                <VisualToneOfVoiceForm storeId={store.id} initialText={store.visual_tone_of_voice} />
              ) : (
                <ConnectStorePrompt description="Connect a store to set its visual tone of voice" />
              )}
            </SettingsCard>
          ),
        },
      ]}
    />
  );
}
