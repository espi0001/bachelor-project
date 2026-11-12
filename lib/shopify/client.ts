import "server-only";

// Server-only client for Shopify's Admin GraphQL API.
// Auth: client credentials grant (Dev Dashboard app installed on our own dev store).
// Docs: https://shopify.dev/docs/apps/build/dev-dashboard/get-api-access-tokens

export const SHOPIFY_API_VERSION = "2026-10";

// Refresh the token this long before Shopify says it expires.
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;

type CachedToken = { value: string; expiresAt: number };

let cachedToken: CachedToken | null = null;
let pendingToken: Promise<CachedToken> | null = null;

function getConfig() {
  const shop = process.env.SHOPIFY_SHOP;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!shop || !clientId || !clientSecret) {
    throw new Error(
      "Missing Shopify config. Set SHOPIFY_SHOP, SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET in .env",
    );
  }

  return { shopDomain: `${shop}.myshopify.com`, clientId, clientSecret };
}

async function requestAccessToken(): Promise<CachedToken> {
  const { shopDomain, clientId, clientSecret } = getConfig();

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

/** Returns a valid access token, reusing the cached one until shortly before it expires. */
async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }

  // Share one in-flight request if several calls need a new token at once.
  pendingToken ??= requestAccessToken().finally(() => {
    pendingToken = null;
  });
  cachedToken = await pendingToken;
  return cachedToken.value;
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
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const { shopDomain } = getConfig();
  const url = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;

  const send = async () =>
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": await getAccessToken(),
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });

  let res = await send();

  // Token revoked or expired early (e.g. app reinstalled): get a new one and retry once.
  if (res.status === 401) {
    cachedToken = null;
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
