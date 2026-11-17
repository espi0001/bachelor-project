/** 
 * Connect-store page: shows the form, or redirects to /products if the org already has a store. 
 */

import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { ConnectStoreForm } from './connect-store-form';

export const metadata = {
  title: 'Forbind butik',
};

export default function ConnectStorePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <Suspense fallback={<p className="text-zinc-500">Indlæser…</p>}>
        <ConnectStoreGate />
      </Suspense>
    </main>
  );
}

// auth() and the DB read are dynamic, so they must render inside Suspense (cacheComponents).
async function ConnectStoreGate() {
  await auth.protect();

  const { orgId } = await auth();
  if (!orgId) {
    return <p className="text-zinc-500">Vælg en organisation først.</p>;
  }

  // An organization that already has a store has nothing to do here.
  const [store] = await sql`SELECT 1 FROM store WHERE auth_org_id = ${orgId} LIMIT 1`;
  if (store) redirect('/products');

  return <ConnectStoreForm />;
}
