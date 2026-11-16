'use client';
/** 
 * Form where the user enters their Shopify domain and connects the store. 
 */

import { useActionState } from 'react';
import { connectStore } from './actions';

export function ConnectStoreForm() {
  const [state, formAction, pending] = useActionState(connectStore, {});
  return (
    <form action={formAction}>
      <label htmlFor="domain">Shopify-domæne</label>
      <input id="domain" name="domain" placeholder="mes-demo-store.myshopify.com" required />
      <button disabled={pending}>{pending ? 'Forbinder…' : 'Forbind butik'}</button>
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}