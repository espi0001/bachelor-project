/** Reads the Shopify store connected to a Clerk organization. */

import "server-only";
import { sql } from "@/lib/db";

export type Store = {
  /** A bigint, which postgres returns as a string. */
  id: string;
  name: string;
  shopify_domain: string;
  last_synced_at: Date | null;
  /** How the store's lifestyle images should look. `null` until the store writes one. */
  visual_tone_of_voice: string | null;
};

/**
 * The organization's store, or `undefined` when it has not connected one (it may have skipped it on /welcome).
 * `orgId` must come from `auth()` or a verified webhook: it is the only thing that keeps customers apart.
 */
export async function getStoreForOrg(orgId: string): Promise<Store | undefined> {
  const [store] = await sql<Store[]>`
    SELECT id, name, shopify_domain, last_synced_at, visual_tone_of_voice FROM store WHERE auth_org_id = ${orgId} LIMIT 1
  `;
  return store;
}
