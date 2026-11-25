/** Reads the Shopify store connected to a Clerk organization. */

import "server-only";
import { sql } from "@/lib/db";

export type Store = {
  /** A bigint, which postgres returns as a string. */
  id: string;
  name: string;
  shopify_domain: string;
  last_synced_at: Date | null;
};

/**
 * The organization's store, or `undefined` when it has not connected one (it may have skipped it on /welcome).
 * `orgId` must come from `auth()` or a verified webhook: it is the only thing that keeps customers apart.
 */
export async function getStoreForOrg(orgId: string): Promise<Store | undefined> {
  const [store] = await sql<Store[]>`
    SELECT id, name, shopify_domain, last_synced_at FROM store WHERE auth_org_id = ${orgId} LIMIT 1
  `;
  return store;
}
