/**
 * Webhook from Clerk: when an organization is deleted, deletes its store and the store's Shopify credentials.
 */

import type { NextRequest } from 'next/server';
import { verifyWebhook } from '@clerk/nextjs/webhooks';
import { sql } from '@/lib/db';
import { forgetAccessToken } from '@/lib/shopify/client';

export async function POST(request: NextRequest) {
  let event: Awaited<ReturnType<typeof verifyWebhook>>;
  try {
    // Checks the Svix signature with CLERK_WEBHOOK_SIGNING_SECRET, so only Clerk can call this route.
    event = await verifyWebhook(request);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  // Other events are acknowledged, so Clerk does not retry them.
  if (event.type !== 'organization.deleted') return new Response('Ignored', { status: 200 });

  const orgId = event.data.id;
  if (!orgId) return new Response('Missing organization id', { status: 400 });

  // An org without a store deletes no rows, which is fine.
  const deleted = await sql<{ shopify_domain: string }[]>`
    DELETE FROM store WHERE auth_org_id = ${orgId}
    RETURNING shopify_domain
  `;
  for (const { shopify_domain } of deleted) forgetAccessToken(shopify_domain);

  return new Response('OK', { status: 200 });
}
