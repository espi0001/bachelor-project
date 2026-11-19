/**
 * Products page: shows the products from the Shopify store connected to the active org as a table.
 */

import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { ShopifyAuthError } from "@/lib/shopify/client";
import { getProducts } from "@/lib/shopify/products";
import { ProductRow } from "@/components/product-row";

export const metadata = {
  title: "Products",
};

export default function ProductsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Products from Shopify</h1>
      <Suspense fallback={<p className="text-zinc-500">Loading products…</p>}>
        <ProductList />
      </Suspense>
    </main>
  );
}

async function ProductList() {
  // Only signed-in users may see store data.
  await auth.protect();

  // Each Clerk organization only sees its own store.
  const { orgId } = await auth();
  if (!orgId) {
    return <p className="text-zinc-500">Select an organization first.</p>;
  }

  const [store] = await sql<{ shopify_domain: string }[]>`
    SELECT shopify_domain FROM store WHERE auth_org_id = ${orgId} LIMIT 1
  `;
  if (!store) {
    return (
      <p className="text-zinc-500">
        No store connected.{" "}
        <Link href="/connect-store" className="underline">
          Connect a store
        </Link>
        .
      </p>
    );
  }

  let products: Awaited<ReturnType<typeof getProducts>>;
  try {
    products = await getProducts(store.shopify_domain);
  } catch (e) {
    if (!(e instanceof ShopifyAuthError)) throw e;
    return (
      <p className="text-zinc-500">
        Shopify no longer accepts the connection to {store.shopify_domain}. The app may have been uninstalled.{" "}
        <Link href="/connect-store?reconnect=1" className="underline">
          Reconnect the store
        </Link>
        .
      </p>
    );
  }

  if (products.length === 0) {
    return <p className="text-zinc-500">No products found in the store.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/15">
      <table className="w-full text-left text-sm">
        <caption className="px-6 py-5 text-left text-lg font-semibold">
          {products.length} product{products.length === 1 ? "" : "s"}
        </caption>
        <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          <tr>
            <th scope="col" className="px-6 py-3 font-medium">Product</th>
            <th scope="col" className="px-6 py-3 font-medium">Images</th>
            <th scope="col" className="px-6 py-3 font-medium">Google</th>
            <th scope="col" className="px-6 py-3 font-medium">Meta</th>
            <th scope="col" className="px-6 py-3 font-medium">Issue</th>
            <th scope="col" className="px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <ProductRow key={product.id} product={product} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
