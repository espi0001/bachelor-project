/**
 * Dashboard entry after sign-in: sends an organization with a store to /products, and one without a store to /welcome.
 */

import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getStoreForOrg } from "@/lib/store";

export const metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="">
      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <RedirectToStart />
      </Suspense>
    </div>
  );
}

// auth() and the DB read are dynamic, so they must render inside Suspense (cacheComponents).
async function RedirectToStart() {
  const { orgId } = await auth.protect();
  if (!orgId) {
    return <p className="text-zinc-500">Select or create an organization in the header to continue.</p>;
  }

  // /welcome, not /connect-store, so the user can skip connecting a store again.
  const store = await getStoreForOrg(orgId);
  redirect(store ? "/products" : "/welcome");
}
