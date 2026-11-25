/**
 * Dashboard entry after sign-in: sends the user to /products. Without a store, /products shows the connect-store card.
 */

import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

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

// auth() is dynamic, so it must render inside Suspense (cacheComponents).
async function RedirectToStart() {
  const { orgId } = await auth.protect();
  if (!orgId) {
    return <p className="text-zinc-500">Select or create an organization in the header to continue.</p>;
  }

  // Not straight to /connect-store: the user may have skipped it on /welcome.
  redirect("/products");
}
