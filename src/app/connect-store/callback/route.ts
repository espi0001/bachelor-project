/**
 * OAuth callback from Shopify: verifies the response, exchanges the code for a token and saves the store for the org.
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import { exchangeCodeForToken, hasRequiredScopes, isValidCallbackHmac, SHOP_DOMAIN_PATTERN } from '@/lib/shopify/oauth';
import { takePendingConnection } from '../oauth-cookie';

// Error codes are turned into messages on /connect-store (see page.tsx).
type ErrorCode = 'expired' | 'org_changed' | 'invalid' | 'exchange' | 'scopes' | 'org_has_store' | 'store_taken';

export async function GET(request: Request) {
  const result = await handleCallback(new URL(request.url).searchParams);
  // Outside try/catch: redirect() works by throwing.
  redirect(result === 'ok' ? '/products' : `/connect-store?error=${result}`);
}

async function handleCallback(params: URLSearchParams): Promise<'ok' | ErrorCode> {
  const pending = await takePendingConnection();
  if (!pending) return 'expired';

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

  try {
    await sql`
      INSERT INTO store (
        name, shopify_domain, auth_org_id, shopify_client_id,
        shopify_client_secret_encrypted, shopify_access_token_encrypted
      )
      VALUES (
        ${pending.name}, ${shop}, ${orgId}, ${pending.clientId},
        ${encrypt(pending.clientSecret)}, ${encrypt(token.accessToken)}
      )
    `;
  } catch (e) {
    const { code: pgCode, constraint_name } = e as { code?: string; constraint_name?: string };
    if (pgCode === '23505') return constraint_name === 'store_auth_org_id_key' ? 'org_has_store' : 'store_taken';
    throw e;
  }

  return 'ok';
}
