'use server';
/** Server actions for the Settings page: disconnecting the organization's store. */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';

export type DisconnectStoreState = { error?: string };

/**
 * Deletes the active organization's store. Its generated_image rows go with it (ON DELETE CASCADE),
 * but the image files in Storage and the app installed in Shopify are left as they are.
 */
export async function disconnectStore(): Promise<DisconnectStoreState> {
  const { orgId } = await auth();
  if (!orgId) return { error: 'Select an organization first.' };

  try {
    await sql`DELETE FROM store WHERE auth_org_id = ${orgId}`;
  } catch (e) {
    console.error('Failed to disconnect store', e);
    return { error: 'The store could not be disconnected. Try again.' };
  }

  // Outside the try: redirect() works by throwing, and the catch would swallow it.
  redirect('/connect-store');
}
