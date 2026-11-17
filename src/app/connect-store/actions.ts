'use server';
/** 
 * Server action for connecting a Shopify store: validates the domain, checks app access and saves it for the org. 
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { getAccessToken } from '@/lib/shopify/client';

type State = { error?: string };

export async function connectStore(_prev: State, formData: FormData): Promise<State> {
  const { orgId } = await auth();
  if (!orgId) return { error: 'Vælg en organisation først.' };

  // Also guard here: the page redirects, but the action can be called directly.
  const [existing] = await sql`SELECT 1 FROM store WHERE auth_org_id = ${orgId} LIMIT 1`;
  if (existing) return { error: 'Organisationen har allerede forbundet en butik.' };

  const domain = String(formData.get('domain')).trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.myshopify\.com$/.test(domain)) return { error: 'Angiv et gyldigt Shopify-domæne, fx mes-demo-store.myshopify.com.' };

  try {
    await getAccessToken(domain);
  } catch {
    return { error: 'Appen kunne ikke få adgang til butikken.' };
  }

  try {
    await sql`INSERT INTO store (shopify_domain, auth_org_id) VALUES (${domain}, ${orgId})`;
  } catch (e) {
    // Unique violation. The DB constraints also catch concurrent requests that passed the check above.
    const { code, constraint_name } = e as { code?: string; constraint_name?: string };
    if (code === '23505' && constraint_name === 'store_auth_org_id_key') {
      return { error: 'Organisationen har allerede forbundet en butik.' };
    }
    if (code === '23505') return { error: 'Butikken er allerede forbundet.' };
    throw e;
  }

  // Outside try/catch: redirect() works by throwing, so a catch would swallow it.
  redirect('/products');
}