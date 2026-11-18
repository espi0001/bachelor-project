/**
 * Shopify OAuth (authorization code grant) for a customer's own app: builds the authorize URL, verifies the callback and exchanges the code for a token.
 */

import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { SHOPIFY_SCOPES } from './scopes';

// Docs: https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/authorization-code-grant

export const SHOP_DOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.myshopify\.com$/;

/** Path of the callback route. The full URL must be added under Redirect URLs in the customer's app. */
export const CALLBACK_PATH = '/connect-store/callback';

/**
 * Callback URLs the customer adds under Redirect URLs in their app (production and local development).
 * Shopify only accepts a redirect_uri from this list, so one app works in both places.
 * Preview deployments get a new host each time and are not on the list.
 */
export const REDIRECT_URLS = ['https://instantimage.vercel.app', 'http://localhost:3000'].map(
  (origin) => `${origin}${CALLBACK_PATH}`,
);

/** URL on the store where the store admin approves (and installs) the app. */
export function buildAuthorizeUrl(opts: { shop: string; clientId: string; redirectUri: string; state: string }): string {
  const params = new URLSearchParams({
    client_id: opts.clientId,
    scope: SHOPIFY_SCOPES.join(','),
    redirect_uri: opts.redirectUri,
    state: opts.state,
  });
  // No grant_options[]=per-user, so Shopify returns an offline token that is not tied to one staff member.
  return `https://${opts.shop}/admin/oauth/authorize?${params}`;
}

/**
 * Checks that the callback query really comes from Shopify: the hmac parameter must be
 * an HMAC-SHA256 of the other parameters (sorted), signed with the app's Client secret.
 */
export function isValidCallbackHmac(searchParams: URLSearchParams, clientSecret: string): boolean {
  const hmac = searchParams.get('hmac');
  if (!hmac) return false;

  // Same encoding as Shopify's own library (@shopify/shopify-api): sorted keys, URL-encoded query string.
  const message = new URLSearchParams(
    [...searchParams.entries()].filter(([key]) => key !== 'hmac').sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  ).toString();

  const expected = createHmac('sha256', clientSecret).update(message).digest();
  const received = Buffer.from(hmac, 'hex');
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/** Exchanges the one-time code from the callback for an offline access token. */
export async function exchangeCodeForToken(opts: {
  shop: string;
  clientId: string;
  clientSecret: string;
  code: string;
}): Promise<{ accessToken: string; scopes: string[] }> {
  const res = await fetch(`https://${opts.shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: opts.clientId, client_secret: opts.clientSecret, code: opts.code }),
    cache: 'no-store',
  });

  if (!res.ok) {
    // Shopify's error body never contains our secret.
    throw new Error(`Shopify token exchange failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; scope: string };
  return { accessToken: data.access_token, scopes: data.scope.split(',').map((s) => s.trim()) };
}

/** True if every scope we need was granted. A write_ scope also gives the matching read_ scope. */
export function hasRequiredScopes(granted: string[]): boolean {
  return SHOPIFY_SCOPES.every(
    (scope) => granted.includes(scope) || granted.includes(scope.replace(/^read_/, 'write_')),
  );
}
