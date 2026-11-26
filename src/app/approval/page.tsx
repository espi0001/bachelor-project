/** Approval page: AI images waiting for the team to approve or reject them. Until a store is connected, it shows the connect-store card. */

import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
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

  // Placeholder until the page itself is built.
  return <p className="typography-body-sm text-muted dark:text-zinc-500">Coming soon.</p>;
}
