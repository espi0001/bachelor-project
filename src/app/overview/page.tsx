/** Overview page: a summary of the store's products and images. Until a store is connected, it shows the connect-store card. */

import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { PageHeader } from "@/components/page-header";
import { ConnectStorePrompt } from "@/components/connect-store-prompt";
import { getStoreForOrg } from "@/lib/store";

export const metadata = {
  title: "Overview",
};

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Overview" description="See how your product images meet the requirements." />
      <Suspense fallback={<p className="text-secondary dark:text-zinc-400">Loading…</p>}>
        <OverviewContent />
      </Suspense>
    </div>
  );
}

// auth() and the DB read are per request, so they must render inside Suspense (cacheComponents).
async function OverviewContent() {
  const { orgId } = await auth.protect();
  if (!orgId) {
    return <p className="text-secondary dark:text-zinc-400">Select an organization first.</p>;
  }

  // Each Clerk organization only sees its own store.
  const store = await getStoreForOrg(orgId);
  if (!store) {
    return <ConnectStorePrompt description="Connect your store to see an overview of your products" />;
  }

  // Placeholder until the page itself is built.
  return <p className="typography-body-sm text-muted dark:text-zinc-500">Coming soon.</p>;
}
