/**
 * Confirmation page shown after a Shopify store was connected (or reconnected), with the store's name, domain and a link to the products.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getStoreForOrg } from '@/lib/store';

export const metadata = {
  title: 'Store connected',
};

export default function StoreConnectedPage({ searchParams }: PageProps<'/connect-store/connected'>) {
  return (
    <div className="">
      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <StoreConnected searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

// auth(), searchParams and the DB read are dynamic, so they must render inside Suspense (cacheComponents).
async function StoreConnected({ searchParams }: Pick<PageProps<'/connect-store/connected'>, 'searchParams'>) {
  const { orgId } = await auth.protect();
  if (!orgId) redirect('/dashboard');

  const store = await getStoreForOrg(orgId);
  // Only an org with a store has something to confirm.
  if (!store) redirect('/dashboard');

  const { reconnect } = await searchParams;
  const heading = reconnect === '1' ? 'Your store is connected again' : 'Your store is connected';

  return (
    <section className="flex flex-col items-start gap-4 rounded-lg border border-black/10 p-6 dark:border-white/15">
      <h1 className="text-2xl font-semibold">{heading}</h1>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-zinc-500">Store</dt>
        <dd className="font-medium">{store.name}</dd>
        <dt className="text-zinc-500">Domain</dt>
        <dd className="font-medium">{store.shopify_domain}</dd>
      </dl>
      <Link href="/products" className="rounded bg-blue-600 px-4 py-2 text-white">
        See products
      </Link>
    </section>
  );
}
