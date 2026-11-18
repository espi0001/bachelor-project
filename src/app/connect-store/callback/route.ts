/**
 * OAuth callback from Shopify: verifies the response, exchanges the code for a token and saves the store for the org.
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import { forgetAccessToken } from '@/lib/shopify/client';
import { exchangeCodeForToken, hasRequiredScopes, isValidCallbackHmac, SHOP_DOMAIN_PATTERN } from '@/lib/shopify/oauth';
import { takePendingConnection, type PendingConnection } from '../oauth-cookie';

// Error codes are turned into messages on /connect-store (see page.tsx).
type ErrorCode = 'expired' | 'org_changed' | 'invalid' | 'exchange' | 'scopes' | 'org_has_store' | 'store_taken';

export async function GET(request: Request) {
  const pending = await takePendingConnection();
  const result = pending ? await handleCallback(new URL(request.url).searchParams, pending) : 'expired';
  // Keep reconnect=1 on errors, so an org with a store stays on /connect-store instead of being sent to /products.
  // Also for 'expired': the cookie is gone, so we cannot tell. The page ignores the flag for orgs without a store.
  const reconnect = pending?.reconnect || result === 'expired' ? '&reconnect=1' : '';
  // Outside try/catch: redirect() works by throwing.
  redirect(result === 'ok' ? '/products' : `/connect-store?error=${result}${reconnect}`);
}

async function handleCallback(params: URLSearchParams, pending: PendingConnection): Promise<'ok' | ErrorCode> {
  const { orgId } = await auth();
  if (orgId !== pending.orgId) return 'org_changed';

  // state: the request belongs to the attempt this browser started (CSRF).
  // shop: Shopify answered for the store the user typed.
  // hmac: the parameters were signed by Shopify with this app's Client secret.
  const shop = params.get('shop');
  const code = params.get('code');
  if (
    params.get('state') !== pending.state ||
    !shop ||
    shop !== pending.domain ||
    !SHOP_DOMAIN_PATTERN.test(shop) ||
    !code ||
    !isValidCallbackHmac(params, pending.clientSecret)
  ) {
    return 'invalid';
  }

  let token: Awaited<ReturnType<typeof exchangeCodeForToken>>;
  try {
    token = await exchangeCodeForToken({ shop, clientId: pending.clientId, clientSecret: pending.clientSecret, code });
  } catch {
    return 'exchange';
  }
  if (!hasRequiredScopes(token.scopes)) return 'scopes';

  const secretEncrypted = encrypt(pending.clientSecret);
  const tokenEncrypted = encrypt(token.accessToken);

  if (pending.reconnect) {
    // Replace the credentials of the org's own store. The domain must match, so an org cannot move to another store.
    const updated = await sql`
      UPDATE store SET
        name = ${pending.name},
        shopify_client_id = ${pending.clientId},
        shopify_client_secret_encrypted = ${secretEncrypted},
        shopify_access_token_encrypted = ${tokenEncrypted}
      WHERE auth_org_id = ${orgId} AND shopify_domain = ${shop}
      RETURNING id
    `;
    if (updated.length > 0) {
      forgetAccessToken(shop);
      return 'ok';
    }
    // The row is gone (e.g. deleted meanwhile): fall through and connect it as a new store.
  }

  try {
    await sql`
      INSERT INTO store (
        name, shopify_domain, auth_org_id, shopify_client_id,
        shopify_client_secret_encrypted, shopify_access_token_encrypted
      )
      VALUES (
        ${pending.name}, ${shop}, ${orgId}, ${pending.clientId},
        ${secretEncrypted}, ${tokenEncrypted}
      )
    `;
  } catch (e) {
    const { code: pgCode, constraint_name } = e as { code?: string; constraint_name?: string };
    if (pgCode === '23505') return constraint_name === 'store_auth_org_id_key' ? 'org_has_store' : 'store_taken';
    throw e;
  }

  return 'ok';
}
