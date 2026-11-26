'use server';
/** Server actions for the Settings page: saving the visual tone of voice and disconnecting the organization's store. */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { forgetAccessToken } from '@/lib/shopify/client';
import { deleteGeneratedImages } from '@/lib/supabase/storage';
import { ADMIN_ROLE } from '@/lib/roles';
import { VISUAL_TONE_OF_VOICE_MAX_LENGTH } from './visual-tone-of-voice';

export type DisconnectStoreState = { error?: string };

export type SaveVisualToneOfVoiceState = {
  error?: string;
  /** The text as saved (trimmed, '' when cleared), so the form can tell whether the draft is still saved. */
  savedText?: string;
};

/**
 * Saves the visual tone of voice on the organization's store. An empty text clears it, and generation
 * then uses the default prompt. Needs a connected store, because the text is deleted with the store.
 * Every member may save it, unlike disconnecting the store, which is admin-only.
 */
export async function saveVisualToneOfVoice(
  _prev: SaveVisualToneOfVoiceState,
  formData: FormData,
): Promise<SaveVisualToneOfVoiceState> {
  const { orgId } = await auth();
  if (!orgId) return { error: 'Select an organization first.' };

  // The id of the store the form was shown for. Without it, a form left open while the store was
  // replaced (another tab or member) would save onto the new store. auth_org_id still decides access.
  const storeId = String(formData.get('storeId') ?? '');
  if (!/^\d+$/.test(storeId)) return { error: 'The visual tone of voice could not be saved. Try again.' };

  // Browsers submit textarea line breaks as \r\n. Store \n, as the field holds it, so the saved text
  // matches the draft (the form compares them to show "Saved.").
  const text = String(formData.get('visualToneOfVoice') ?? '').replace(/\r\n/g, '\n').trim();
  if (text.length > VISUAL_TONE_OF_VOICE_MAX_LENGTH) {
    return { error: `Keep the text under ${VISUAL_TONE_OF_VOICE_MAX_LENGTH} characters.` };
  }

  try {
    const updated = await sql`
      UPDATE store SET visual_tone_of_voice = ${text || null}
      WHERE id = ${storeId} AND auth_org_id = ${orgId}
      RETURNING id
    `;
    if (updated.length === 0) {
      return { error: 'This store is no longer connected. Reload the page to see the current store.' };
    }
  } catch (e) {
    console.error('Failed to save visual tone of voice', e);
    return { error: 'The visual tone of voice could not be saved. Try again.' };
  }

  return { savedText: text };
}

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
