'use server';
/**
 * Server action that starts connecting a Shopify store: validates the input and sends the user to Shopify to approve the customer's own app.
 */

import { randomBytes } from 'node:crypto';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { getRequestOrigin } from '@/lib/request-origin';
import { buildAuthorizeUrl, CALLBACK_PATH, REDIRECT_URLS, SHOP_DOMAIN_PATTERN } from '@/lib/shopify/oauth';
import { savePendingConnection } from './oauth-cookie';

// The secret is never sent back to the browser, so the user has to type it again after an error.
export type ConnectStoreValues = { name: string; domain: string; clientId: string };
export type ConnectStoreState = { error?: string; values?: ConnectStoreValues };

const field = (formData: FormData, key: string) => String(formData.get(key) ?? '').trim();

export async function connectStore(_prev: ConnectStoreState, formData: FormData): Promise<ConnectStoreState> {
  const { orgId } = await auth();
  if (!orgId) return { error: 'Select an organization first.' };

  const values: ConnectStoreValues = {
    name: field(formData, 'name'),
    domain: field(formData, 'domain').toLowerCase(),
    clientId: field(formData, 'clientId'),
  };
  const clientSecret = field(formData, 'clientSecret');

  // One store per org. An org that already has a store may only reconnect that same store
  // (e.g. after the app was uninstalled and Shopify revoked the token).
  const [existing] = await sql<{ shopify_domain: string }[]>`
    SELECT shopify_domain FROM store WHERE auth_org_id = ${orgId} LIMIT 1
  `;
  if (existing && existing.shopify_domain !== values.domain) {
    return { error: 'This organization has already connected a store.', values };
  }

  if (!values.name || values.name.length > 100) return { error: 'Enter a connection name (max 100 characters).', values };
  if (!SHOP_DOMAIN_PATTERN.test(values.domain)) {
    return { error: 'Enter a valid Shopify domain, e.g. my-store.myshopify.com.', values };
  }
  if (!values.clientId || !clientSecret) return { error: 'Enter both the Client ID and the Client secret.', values };

  // Checked again in the callback (unique constraint), but saves the user a trip to Shopify.
  const [taken] = await sql`
    SELECT 1 FROM store WHERE shopify_domain = ${values.domain} AND auth_org_id <> ${orgId} LIMIT 1
  `;
  if (taken) return { error: 'This store is already connected.', values };

  // Shopify rejects a redirect_uri that is not under Redirect URLs in the customer's app (see the guide, step 4).
  const redirectUri = `${await getRequestOrigin()}${CALLBACK_PATH}`;
  if (!REDIRECT_URLS.includes(redirectUri)) {
    return { error: `Stores can only be connected from ${REDIRECT_URLS.map((url) => new URL(url).host).join(' or ')}.`, values };
  }

  // Random value that must come back unchanged from Shopify (protects against CSRF).
  const state = randomBytes(16).toString('hex');
  await savePendingConnection({ state, orgId, ...values, clientSecret, reconnect: !!existing });

  // Proof of ownership happens on Shopify: only a store admin can approve the app.
  redirect(
    buildAuthorizeUrl({
      shop: values.domain,
      clientId: values.clientId,
      redirectUri,
      state,
    }),
  );
}
