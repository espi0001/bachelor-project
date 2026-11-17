/** 
 * Products page: lists the products and images from the Shopify store connected to the active org. 
 */

import Image from "next/image";
import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { getProducts } from "@/lib/shopify/products";

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
    return <p className="text-zinc-500">Vælg en organisation først.</p>;
  }

  const [store] = await sql<{ shopify_domain: string }[]>`
    SELECT shopify_domain FROM store WHERE auth_org_id = ${orgId} LIMIT 1
  `;
  if (!store) {
    return (
      <p className="text-zinc-500">
        Ingen butik forbundet.{" "}
        <Link href="/connect-store" className="underline">
          Forbind en butik
        </Link>
        .
      </p>
    );
  }

  const products = await getProducts(store.shopify_domain);

  if (products.length === 0) {
    return <p className="text-zinc-500">No products found in the store.</p>;
  }

  return (
    <>
      <p className="mb-4 text-sm text-zinc-500">{products.length} products</p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <li
            key={product.id}
            className="rounded-lg border border-black/10 p-4 dark:border-white/15"
          >
            <h2 className="font-medium">{product.title}</h2>
            <p className="mb-3 text-xs text-zinc-500">
              {product.status.toLowerCase()} · {product.images.length} image
              {product.images.length === 1 ? "" : "s"}
            </p>
            <div className="flex flex-wrap gap-2">
              {product.images.map((image) => (
                <figure key={image.id} className="w-24">
                  <Image
                    src={image.url}
                    alt={image.altText ?? product.title}
                    width={96}
                    height={96}
                    className="h-24 w-24 rounded object-cover"
                  />
                  <figcaption className="mt-1 text-center text-xs text-zinc-500">
                    {image.width && image.height
                      ? `${image.width} × ${image.height}`
                      : "size unknown"}
                  </figcaption>
                </figure>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
