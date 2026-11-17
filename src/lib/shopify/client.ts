/** 
 * Server-only client for Shopify's Admin GraphQL API: gets access tokens and sends queries per store. 
 */

import "server-only";

// Auth: client credentials grant (Dev Dashboard app installed on our own dev store).
// Docs: https://shopify.dev/docs/apps/build/dev-dashboard/get-api-access-tokens

export const SHOPIFY_API_VERSION = "2026-10";

// Refresh the token this long before Shopify says it expires.
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;

type CachedToken = { value: string; expiresAt: number };

// One token per store, keyed by shop domain (e.g. "mes-demo-store.myshopify.com").
const cachedTokens = new Map<string, CachedToken>();
const pendingTokens = new Map<string, Promise<CachedToken>>();

function getConfig() {
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing Shopify config. Set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET in .env",
    );
  }

  return { clientId, clientSecret };
}

async function requestAccessToken(shopDomain: string): Promise<CachedToken> {
  const { clientId, clientSecret } = getConfig();

  const res = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    // Shopify returns a JSON error body (e.g. shop_not_permitted). It never contains our secret.
    throw new Error(
      `Shopify token request failed (${res.status}): ${await res.text()}`,
    );
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  return {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - TOKEN_REFRESH_MARGIN_MS,
  };
}

/**
 * Returns a valid access token for the store, reusing the cached one until shortly
 * before it expires. Throws if the app has no access to the store.
 */
export async function getAccessToken(shopDomain: string): Promise<string> {
  const cached = cachedTokens.get(shopDomain);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.value;
  }

  // Share one in-flight request if several calls need a new token at once.
  let pending = pendingTokens.get(shopDomain);
  if (!pending) {
    pending = requestAccessToken(shopDomain).finally(() => {
      pendingTokens.delete(shopDomain);
    });
    pendingTokens.set(shopDomain, pending);
  }

  const token = await pending;
  cachedTokens.set(shopDomain, token);
  return token.value;
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

  const send = async () =>
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": await getAccessToken(shopDomain),
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });

  let res = await send();

  // Token revoked or expired early (e.g. app reinstalled): get a new one and retry once.
  if (res.status === 401) {
    cachedTokens.delete(shopDomain);
    res = await send();
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
