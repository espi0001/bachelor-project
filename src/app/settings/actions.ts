'use server';
/** Server actions for the Settings page: disconnecting the organization's store. */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { forgetAccessToken } from '@/lib/shopify/client';
import { deleteGeneratedImages } from '@/lib/supabase/storage';
import { ADMIN_ROLE } from '@/lib/roles';

export type DisconnectStoreState = { error?: string };

/**
 * Admins only. Deletes the store the user confirmed, its generated_image rows (ON DELETE CASCADE) and their files
 * in Storage. The app installed in Shopify is left as it is.
 */
export async function disconnectStore(_prev: DisconnectStoreState, formData: FormData): Promise<DisconnectStoreState> {
  const { orgId, has } = await auth();
  if (!orgId) return { error: 'Select an organization first.' };
  // The page hides the button from members, but anyone can call a server action directly.
  if (!has({ role: ADMIN_ROLE })) return { error: 'Only admins can disconnect the store.' };

  // The id of the store shown in the dialog. Without it, a dialog left open while the store was
  // replaced (another tab or member) would delete the new store. auth_org_id still decides access.
  const storeId = String(formData.get('storeId') ?? '');
  if (!/^\d+$/.test(storeId)) return { error: 'The store could not be disconnected. Try again.' };

  let deleted: { shopify_domain: string; storage_paths: string[] } | undefined;
  try {
    // Read the paths before the delete, because the cascade removes the rows that hold them.
    [deleted] = await sql<{ shopify_domain: string; storage_paths: string[] }[]>`
      WITH paths AS (
        SELECT COALESCE(array_agg(storage_path), '{}') AS storage_paths
        FROM generated_image WHERE store_id = ${storeId}
      )
      DELETE FROM store
      WHERE id = ${storeId} AND auth_org_id = ${orgId}
      RETURNING shopify_domain, (SELECT storage_paths FROM paths) AS storage_paths
    `;
  } catch (e) {
    console.error('Failed to disconnect store', e);
    return { error: 'The store could not be disconnected. Try again.' };
  }

  if (!deleted) {
    return { error: 'This store is no longer connected. Reload the page to see the current store.' };
  }

  // The client caches the decrypted token per domain. Drop it, as the Clerk webhook does, so a
  // later connection of the same domain with other app credentials does not reuse it.
  forgetAccessToken(deleted.shopify_domain);

  // The store is already gone, so a failure here only leaves files behind. Log them for cleanup
  // instead of telling the user the disconnect failed.
  try {
    await deleteGeneratedImages(deleted.storage_paths);
  } catch (e) {
    console.error('Store disconnected, but its image files were not deleted', deleted.storage_paths, e);
  }

  // Outside the try blocks: redirect() works by throwing, and a catch would swallow it.
  redirect('/connect-store');
}
