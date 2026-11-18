/**
 * Returns the origin (protocol + host) of the current request, e.g. http://localhost:3000.
 */

import 'server-only';
import { headers } from 'next/headers';

export async function getRequestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}
