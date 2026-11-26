/**
 * Overview of the shop's product images.
 * Awaiting approval is still a sample number.
 */

import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { sql } from "@/lib/db";
import { ShopifyAuthError } from "@/lib/shopify/client";
import { getProducts, type Product } from "@/lib/shopify/products";
import { imageIssues } from "./image-requirements";
import { IssuesTable } from "./issues-table";
import { overviewQueryFromSearch } from "./overview-query";
import { AWAITING_APPROVAL } from "./sample-figures";
import { StatCard } from "./stat-card";

export const metadata = {
  title: "Overview",
};

export default function OverviewPage({ searchParams }: PageProps<"/overview">) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Overview"
        description="Status of the shop's product images."
        action={
          <div className="flex flex-wrap gap-2">
            <p id="sync-unavailable" className="sr-only">
              Shop sync is not built yet.
            </p>
            <Button variant="secondary" disabled aria-describedby="sync-unavailable">
              Sync with shop
            </Button>
            <ButtonLink href="#issues">Review issues</ButtonLink>
          </div>
        }
      />
      <Suspense fallback={<p className="text-secondary">Loading overview…</p>}>
        <OverviewContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function OverviewContent({ searchParams }: Pick<PageProps<"/overview">, "searchParams">) {
  await auth.protect();
  const query = overviewQueryFromSearch(await searchParams);

  const { orgId } = await auth();
  if (!orgId) {
    return <p className="text-secondary">Select an organization first.</p>;
  }

  const [store] = await sql<{ shopify_domain: string }[]>`
    SELECT shopify_domain FROM store WHERE auth_org_id = ${orgId} LIMIT 1
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

  let products: Product[];
  try {
    products = await getProducts(store.shopify_domain);
  } catch (error) {
    if (!(error instanceof ShopifyAuthError)) throw error;
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

  const reviewed = products.map((product) => ({ product, issues: imageIssues(product.images) }));
  const failing = reviewed.filter((row) => row.issues.some((issue) => issue.severity === "error"));
  const attention = reviewed.filter((row) => row.issues.some((issue) => issue.severity === "attention"));
  const withIssues = reviewed.filter((row) => row.issues.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total products" value={String(products.length)} detail="Fetched from the shop" />
        <StatCard
          label="Does not meet requirements"
          value={String(failing.length)}
          detail="Fails an image requirement"
        />
        <StatCard label="Needs attention" value={String(attention.length)} detail="Not an error yet" />
        <StatCard label="Awaiting approval" {...AWAITING_APPROVAL} />
      </div>
      <IssuesTable rows={withIssues} query={query} />
    </div>
  );
}
