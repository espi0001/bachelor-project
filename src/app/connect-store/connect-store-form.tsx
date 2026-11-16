'use client';
/** 
 * Form where the user enters their Shopify domain and connects the store. 
 */

import { useActionState } from 'react';
import { connectStore } from './actions';

export function ConnectStoreForm() {
  const [state, formAction, pending] = useActionState(connectStore, {});
  return (
    <form action={formAction} className="flex flex-col gap-2 border p-4 rounded">
      <label htmlFor="domain" className="font-semibold">Shopify-domæne</label>
      
      <input className="border p-2 rounded" id="domain" name="domain" placeholder="demo-store.myshopify.com" required />
      
      <button disabled={pending} className="mt-4 border p-2 rounded bg-blue-500 text-white">{pending ? 'Forbinder…' : 'Forbind butik'}</button>
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}