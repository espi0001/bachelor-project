/**
 * Connect-store page: shows the connect wizard to admins (with any error from the OAuth callback),
 * or redirects to /products if the org already has a store.
 */

import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { REDIRECT_URLS } from '@/lib/shopify/oauth';
import { ADMIN_ROLE } from '@/lib/roles';
import { ConnectStoreWizard } from './connect-store-wizard';

export const metadata = {
  title: 'Connect store',
};

// Messages for the error codes the OAuth callback (callback/route.ts) redirects with.
const CALLBACK_ERRORS: Record<string, string> = {
  expired: 'The connection attempt expired or was started in another browser. Please try again.',
  org_changed: 'You switched organization while connecting. Please try again.',
  not_admin: 'Only admins can connect a store.',
  invalid: "Shopify's response could not be verified. Check the Client secret and try again.",
  exchange: 'Shopify did not return an access token. Check the Client ID and Client secret, and that the app is installed.',
  scopes: 'The app is missing required permissions. Add the scopes from step 1, release the app and try again.',
  org_has_store: 'This organization has already connected a store.',
  store_taken: 'This store is already connected.',
};

export default function ConnectStorePage({ searchParams }: PageProps<'/connect-store'>) {
  return (
    <div className="flex justify-center">
      <Suspense fallback={<p className="typography-body-sm text-secondary dark:text-zinc-400">Loading…</p>}>
        <ConnectStoreGate searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

// auth(), searchParams and the DB read are dynamic, so they must render inside Suspense (cacheComponents).
async function ConnectStoreGate({ searchParams }: Pick<PageProps<'/connect-store'>, 'searchParams'>) {
  await auth.protect();

  const { orgId, has } = await auth();
  if (!orgId) {
    return <p className="typography-body-sm text-secondary dark:text-zinc-400">Select an organization first.</p>;
  }

  const { error, reconnect } = await searchParams;

  // An organization that already has a store only comes here to reconnect it (e.g. after the app was uninstalled).
  const [store] = await sql<{ name: string; shopify_domain: string; shopify_client_id: string }[]>`
    SELECT name, shopify_domain, shopify_client_id FROM store WHERE auth_org_id = ${orgId} LIMIT 1
  `;
  if (store && reconnect !== '1') redirect('/products');

  // Members reach this page from the connect-store card and the reconnect links, so explain instead of redirecting.
  if (!has({ role: ADMIN_ROLE })) {
    return <p className="typography-body-sm text-secondary dark:text-zinc-400">Only admins can connect a store. Ask an admin in your organization to do it.</p>;
  }

  // Object.hasOwn: only our own codes, not inherited keys such as "constructor".
  const initialError = typeof error === 'string' && Object.hasOwn(CALLBACK_ERRORS, error) ? CALLBACK_ERRORS[error] : undefined;

  return (
    <ConnectStoreWizard
      redirectUrls={REDIRECT_URLS}
      initialError={initialError}
      reconnectValues={store ? { name: store.name, domain: store.shopify_domain, clientId: store.shopify_client_id } : undefined}
    />
  );
}
