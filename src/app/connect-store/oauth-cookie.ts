/**
 * Short-lived, encrypted cookie that carries the connection details from the form to the OAuth callback.
 */

import 'server-only';
import { cookies } from 'next/headers';
import { decrypt, encrypt } from '@/lib/crypto';

// Nothing is saved in the database until Shopify has confirmed the connection,
// so the details wait in this cookie while the user approves the app on Shopify.
const COOKIE_NAME = 'shopify_oauth';
const MAX_AGE_SECONDS = 10 * 60;

export type PendingConnection = {
  state: string;
  orgId: string;
  name: string;
  domain: string;
  clientId: string;
  clientSecret: string;
};

export async function savePendingConnection(pending: PendingConnection): Promise<void> {
  (await cookies()).set(COOKIE_NAME, encrypt(JSON.stringify(pending)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // 'lax' so the cookie is sent when Shopify redirects the browser back to us.
    sameSite: 'lax',
    path: '/connect-store',
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Reads and deletes the cookie, so each connection attempt can only be used once. */
export async function takePendingConnection(): Promise<PendingConnection | null> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  store.delete({ name: COOKIE_NAME, path: '/connect-store' });
  if (!value) return null;
  try {
    return JSON.parse(decrypt(value)) as PendingConnection;
  } catch {
    return null;
  }
}
