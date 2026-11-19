/** Dashboard entry: sends the user to /products if the active organization has a store, otherwise to /connect-store. */

import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";

export const metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <RedirectToStart />
      </Suspense>
    </main>
  );
}

// auth() and the DB read are dynamic, so they must render inside Suspense (cacheComponents).
async function RedirectToStart() {
  const { orgId } = await auth.protect();
  if (!orgId) {
    return <p className="text-zinc-500">Select or create an organization in the header to continue.</p>;
  }

  const [store] = await sql<{ id: string }[]>`
    SELECT id FROM store WHERE auth_org_id = ${orgId} LIMIT 1
  `;
  redirect(store ? "/products" : "/connect-store");
}
