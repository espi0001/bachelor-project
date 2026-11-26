/**
 * Dashboard entry after sign-in: always sends the user to /overview, which shows the connect-store card until a store is connected.
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

// auth() is per request, so it must render inside Suspense (cacheComponents).
async function RedirectToStart() {
  const { orgId } = await auth.protect();
  if (!orgId) {
    return <p className="text-zinc-500">Select or create an organization in the header to continue.</p>;
  }

  // /overview, not /welcome, so a user who skipped connecting a store does not see onboarding again.
  redirect("/overview");
}
