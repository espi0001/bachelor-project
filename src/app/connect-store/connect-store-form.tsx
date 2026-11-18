'use client';
/**
 * Credentials step of the connect-store wizard: the user enters connection name, shop domain, Client ID and Client secret, then approves the app on Shopify.
 */

import { useActionState } from 'react';
import { connectStore, type ConnectStoreState, type ConnectStoreValues } from './actions';

const inputClass = 'w-full rounded border border-black/15 px-3 py-2 dark:border-white/20';

type Props = {
  onBack: () => void;
  initialError?: string;
  /** Saved values of the org's store when it reconnects. The domain cannot be changed then. */
  reconnectValues?: ConnectStoreValues;
};

export function ConnectStoreForm({ onBack, initialError, reconnectValues }: Props) {
  const [state, formAction, pending] = useActionState<ConnectStoreState, FormData>(connectStore, {
    error: initialError,
    values: reconnectValues,
  });
  const values = state.values;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">{reconnectValues ? 'Reconnect your store' : 'Enter your app credentials'}</h2>
        <p className="text-sm text-zinc-500">
          You&apos;ll find the Client ID and Client secret under <strong>Settings</strong> in your app in the Shopify Dev Dashboard.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="font-medium">Connection name</label>
        <input id="name" name="name" required maxLength={100} defaultValue={values?.name} placeholder="e.g. Acme - Denmark" className={inputClass} />
        <p className="text-sm text-zinc-500">Use a name you will recognize. The store name and the market work well.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="domain" className="font-medium">Shop domain</label>
        <input id="domain" name="domain" required defaultValue={values?.domain} readOnly={!!reconnectValues} placeholder="my-store.myshopify.com" className={inputClass} />
        <p className="text-sm text-zinc-500">
          The <code>.myshopify.com</code> domain, not a custom domain.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="clientId" className="font-medium">Client ID</label>
        <input id="clientId" name="clientId" required autoComplete="off" defaultValue={values?.clientId} placeholder="From your app settings" className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="clientSecret" className="font-medium">Client secret</label>
        <input id="clientSecret" name="clientSecret" type="password" required autoComplete="off" placeholder="From your app settings" className={inputClass} />
      </div>

      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}

      <div className="flex items-center gap-4">
        <button disabled={pending} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60">
          {pending ? 'Connecting…' : 'Connect to Shopify'}
        </button>
        <button type="button" onClick={onBack} className="text-sm text-zinc-600 hover:underline">← Back</button>
      </div>
    </form>
  );
}
