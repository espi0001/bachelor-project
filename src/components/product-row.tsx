/**
 * One row in the products table: thumbnail, name, image count, channel status and a link to the product page.
 */

import Image from "next/image";
import Link from "next/link";
import { productUrlId, type Product } from "@/lib/shopify/products";

export function ProductRow({ product }: { product: Product }) {
  const thumbnail = product.images[0];

  return (
    <tr className="border-t border-black/10 dark:border-white/15">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          {thumbnail ? (
            <Image
              src={thumbnail.url}
              alt={thumbnail.altText ?? product.title}
              width={48}
              height={48}
              className="h-12 w-12 shrink-0 rounded-md border border-black/10 object-cover dark:border-white/15"
            />
          ) : (
            // No images yet: grey placeholder, as in the design.
            <div
              aria-hidden="true"
              className="h-12 w-12 shrink-0 rounded-md border border-black/10 bg-zinc-200 dark:border-white/15 dark:bg-zinc-800"
            />
          )}
          <span className="font-medium">{product.title}</span>
        </div>
      </td>
      <td className="px-6 py-4">{product.images.length}</td>
      {/* Google, Meta and Issue have no data yet; they are filled in when we check the channel requirements. */}
      <td className="px-6 py-4 text-zinc-500">–</td>
      <td className="px-6 py-4 text-zinc-500">–</td>
      <td className="px-6 py-4 text-zinc-500">–</td>
      <td className="px-6 py-4 text-right">
        <Link
          href={`/products/${productUrlId(product.id)}`}
          className="inline-block rounded-md border border-black/20 px-4 py-2 text-sm font-medium hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white/25 dark:hover:bg-white/10"
        >
          Open
          <span className="sr-only"> {product.title}</span>
        </Link>
      </td>
    </tr>
  );
}
