/**
 * Product page: shows one product from the active org's Shopify store with all its images.
 */

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { GenerateImagesDialog } from "@/components/generate-images-dialog";
import { sql } from "@/lib/db";
import { ShopifyAuthError } from "@/lib/shopify/client";
import { getProduct, productIdFromUrl, type Product } from "@/lib/shopify/products";

export const metadata = {
  title: "Product",
};

export default function ProductPage({ params }: PageProps<"/products/[id]">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      {/* With cacheComponents, params are request data and must be read inside Suspense. */}
      <Suspense fallback={<p className="text-zinc-500">Loading product…</p>}>
        {params.then(({ id }) => (
          <ProductDetail urlId={id} />
        ))}
      </Suspense>
    </main>
  );
}

async function ProductDetail({ urlId }: { urlId: string }) {
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

  // The ID comes from the URL, so anyone can change it. Only plain numbers are valid,
  // and the lookup only searches this org's store.
  const productId = productIdFromUrl(urlId);
  if (!productId) notFound();

  let product: Product | null;
  try {
    product = await getProduct(store.shopify_domain, productId);
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
  if (!product) notFound();

  const imageCount = product.images.length;

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-zinc-500">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/products" className="hover:underline">
              Products
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground">
            {product.title}
          </li>
        </ol>
      </nav>

      <h1 className="text-3xl font-semibold">{product.title}</h1>
      <p className="mb-8 mt-1 text-zinc-500">
        {imageCount} image{imageCount === 1 ? "" : "s"}
      </p>

      <section
        aria-labelledby="product-images-heading"
        className="rounded-xl border border-black/10 p-6 dark:border-white/15"
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 id="product-images-heading" className="text-lg font-semibold">
            Product images
          </h2>
          {/* Disabled without images for now: the first image is the only source until upload exists. */}
          <GenerateImagesDialog
            productUrlId={urlId}
            productTitle={product.title}
            disabledReason={imageCount === 0 ? "Add an image to generate from" : undefined}
          />
        </div>

        {imageCount === 0 ? (
          <p className="text-zinc-500">This product has no images yet.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            {product.images.map((image, i) => (
              <li key={image.id}>
                <figure>
                  <Image
                    src={image.url}
                    alt={image.altText ?? product.title}
                    width={320}
                    height={320}
                    className="aspect-square w-full rounded-md border border-black/10 bg-zinc-100 object-contain dark:border-white/15 dark:bg-zinc-900"
                  />
                  <figcaption className="mt-2 text-sm text-zinc-500">
                    Position {i + 1} ·{" "}
                    {image.width && image.height
                      ? `${image.width} × ${image.height} px`
                      : "size unknown"}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
