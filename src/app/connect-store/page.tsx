/**
 * Connect-store page: shows the connect wizard (with any error from the OAuth callback), or redirects to /products if the org already has a store.
 */

import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { REDIRECT_URLS } from '@/lib/shopify/oauth';
import { ConnectStoreWizard } from './connect-store-wizard';

export const metadata = {
  title: 'Connect store',
};

// Messages for the error codes the OAuth callback (callback/route.ts) redirects with.
const CALLBACK_ERRORS: Record<string, string> = {
  expired: 'The connection attempt expired or was started in another browser. Please try again.',
  org_changed: 'You switched organization while connecting. Please try again.',
  invalid: "Shopify's response could not be verified. Check the Client secret and try again.",
  exchange: 'Shopify did not return an access token. Check the Client ID and Client secret, and that the app is installed.',
  scopes: 'The app is missing required permissions. Add the scopes from step 1, release the app and try again.',
  org_has_store: 'This organization has already connected a store.',
  store_taken: 'This store is already connected.',
};

export default function ConnectStorePage({ searchParams }: PageProps<'/connect-store'>) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <ConnectStoreGate searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

// auth(), searchParams and the DB read are dynamic, so they must render inside Suspense (cacheComponents).
async function ConnectStoreGate({ searchParams }: Pick<PageProps<'/connect-store'>, 'searchParams'>) {
  await auth.protect();

  const { orgId } = await auth();
  if (!orgId) {
    return <p className="text-zinc-500">Select an organization first.</p>;
  }

  // An organization that already has a store has nothing to do here.
  const [store] = await sql`SELECT 1 FROM store WHERE auth_org_id = ${orgId} LIMIT 1`;
  if (store) redirect('/products');

  const { error } = await searchParams;
  const initialError = typeof error === 'string' ? CALLBACK_ERRORS[error] : undefined;

  return <ConnectStoreWizard redirectUrls={REDIRECT_URLS} initialError={initialError} />;
}
