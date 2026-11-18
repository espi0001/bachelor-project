/**
 * Server-only client for Shopify's Admin GraphQL API: reads each store's access token and sends queries per store.
 */

import "server-only";
import { sql } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

// Auth: each store's offline access token comes from the OAuth flow (src/lib/shopify/oauth.ts)
// and is stored encrypted in the store table. It does not expire, but stops working if the
// app is uninstalled; then the store has to be connected again.

export const SHOPIFY_API_VERSION = "2026-10";

// Decrypted tokens kept in memory, keyed by shop domain (e.g. "mes-demo-store.myshopify.com").
const cachedTokens = new Map<string, string>();

/** Thrown when Shopify rejects the stored token (app uninstalled or token revoked). The store must be reconnected. */
export class ShopifyAuthError extends Error {
  constructor() {
    super("Shopify rejected the access token. Connect the store again.");
    this.name = "ShopifyAuthError";
  }
}

/** Removes a cached token, so the next request reads the new one from the database (used after reconnecting). */
export function forgetAccessToken(shopDomain: string): void {
  cachedTokens.delete(shopDomain);
}

/** Returns the store's access token from the database. Throws if the store is not connected. */
async function getAccessToken(shopDomain: string): Promise<string> {
  const cached = cachedTokens.get(shopDomain);
  if (cached) return cached;

  const [store] = await sql<{ shopify_access_token_encrypted: string }[]>`
    SELECT shopify_access_token_encrypted FROM store WHERE shopify_domain = ${shopDomain} LIMIT 1
  `;
  if (!store) {
    throw new Error(`No connected store with domain ${shopDomain}`);
  }

  const token = decrypt(store.shopify_access_token_encrypted);
  cachedTokens.set(shopDomain, token);
  return token;
}

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

/**
 * Sends a GraphQL query or mutation to the Shopify Admin API.
 * Throws if the request fails or Shopify returns GraphQL errors.
 */
export async function shopifyAdminFetch<T>(
  shopDomain: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const url = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;

  const send = (token: string) =>
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });

  const token = await getAccessToken(shopDomain);
  let res = await send(token);

  if (res.status === 401) {
    // The cache is per server instance. If the store was reconnected on another instance,
    // the database already has a new token: read it and retry once.
    forgetAccessToken(shopDomain);
    const fresh = await getAccessToken(shopDomain);
    if (fresh !== token) res = await send(fresh);
  }

  // Still rejected: the token in the database is revoked too (e.g. app uninstalled).
  if (res.status === 401) {
    forgetAccessToken(shopDomain);
    throw new ShopifyAuthError();
  }

  if (!res.ok) {
    throw new Error(`Shopify API request failed (${res.status}): ${await res.text()}`);
  }

  const json = (await res.json()) as GraphQLResponse<T>;

  if (json.errors?.length) {
    throw new Error(
      `Shopify GraphQL error: ${json.errors.map((e) => e.message).join("; ")}`,
    );
  }
  if (!json.data) {
    throw new Error("Shopify GraphQL response had no data");
  }

  return json.data;
}
