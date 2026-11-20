'use client';
/**
 * Three-step guide for connecting a Shopify store: create a custom app, install it, then enter its credentials and approve it on Shopify.
 */

import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { SHOPIFY_SCOPES } from '@/lib/shopify/scopes';
import type { ConnectStoreValues } from './actions';
import { ConnectStoreForm } from './connect-store-form';

const DEV_DASHBOARD_URL = 'https://dev.shopify.com/dashboard/';
// The app is not opened from Shopify admin, so App URL only needs a valid address (same as Instant uses).
const APP_URL = DEV_DASHBOARD_URL;
const SCOPES = SHOPIFY_SCOPES.join(',');

const STEPS = ['Custom app', 'Installation', 'Credentials'] as const;

type Props = {
  /** OAuth callback URLs the user must add under Redirect URLs in their app. */
  redirectUrls: string[];
  /** Error from a failed OAuth callback. Opens the guide on the credentials step. */
  initialError?: string;
  /** The org's existing store when it reconnects. Opens the credentials step with the saved values. */
  reconnectValues?: ConnectStoreValues;
};

export function ConnectStoreWizard({ redirectUrls, initialError, reconnectValues }: Props) {
  const [step, setStep] = useState(initialError || reconnectValues ? 2 : 0);
  const [showHelp, setShowHelp] = useState(false);

  const goTo = (next: number) => {
    setStep(next);
    setShowHelp(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <Stepper current={step} />

      <section className="flex flex-col gap-4 rounded-lg border border-black/10 p-6 dark:border-white/15">
        {step === 0 && (
          <>
            <Intro title="Do you have a custom app for this store?">
              Instant Image connects to Shopify through a custom app that you create in the Shopify Dev Dashboard. Each store
              gets its own app.
            </Intro>
            {showHelp ? (
              <>
                <p className="text-sm text-zinc-500">Setting up a custom app takes about 5 minutes.</p>
                <ol className="flex flex-col gap-4">
                  <Instruction n={1}>
                    Go to your{' '} 
                    <a href={DEV_DASHBOARD_URL} target="_blank" rel="noreferrer" className="underline">
                      Shopify Dev Dashboard ↗</a>{' '}
                    and click <strong>Create app</strong>. Give the app a name, then click <strong>Create</strong>.
                  </Instruction>
                  <Instruction n={2}>
                    Under <strong>URLs</strong>, paste this address in <strong>App URL</strong>, and clear{' '}
                    <strong>Embed app in Shopify admin</strong>:
                    <CopyBlock value={APP_URL} />
                  </Instruction>
                  <Instruction n={3}>
                    Under <strong>Access → Scopes</strong>, add these permissions:
                    <CopyBlock value={SCOPES} />
                  </Instruction>
                  <Instruction n={4}>
                    Under <strong>Access → Redirect URLs</strong>, add these addresses (comma-separated):
                    {/* Shopify's field takes a comma-separated list. One URL per line gives "Not a valid HTTP URL". */}
                    <CopyBlock value={redirectUrls.join(', ')} />
                  </Instruction>
                  <Instruction n={5}>
                    Click <strong>Release</strong>, then click <strong>Release</strong> again in the window that opens.
                  </Instruction>
                  <Instruction n={6}>
                    Finally, go to <strong>Settings</strong>. You need the <strong>Client ID</strong> and the <strong>Client secret</strong>{' '}
                    in the last step.
                  </Instruction>
                </ol>
                <Button onClick={() => goTo(1)} className="self-start">Done, continue</Button>
              </>
            ) : (
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => setShowHelp(true)}>I need to create one</Button>
                <Button onClick={() => goTo(1)}>I have one</Button>
              </div>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <Intro title="Has the app been installed on the store?">
              The custom app needs to be installed on the Shopify store before Instant Image can authorize access.
            </Intro>
            {showHelp ? (
              <>
                <ol className="flex flex-col gap-4">
                  <Instruction n={1}>
                    In the Dev Dashboard, click the name of your app, then click <strong>Install app</strong>.
                  </Instruction>
                  <Instruction n={2}>
                    Choose the store, then click <strong>Install</strong>. Shopify then opens the Dev Dashboard again.
                  </Instruction>
                </ol>
                <p className="rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
                  <strong>Tip:</strong> You don&apos;t need to wait for the installation. You can fill in the connection details
                  now and authorize once the app is installed.
                </p>
                <Button onClick={() => goTo(2)} className="self-start">Got it, continue</Button>
              </>
            ) : (
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => setShowHelp(true)}>How do I install it?</Button>
                <Button onClick={() => goTo(2)}>It&apos;s installed</Button>
              </div>
            )}
            <Button variant="tertiary" leadingIcon="arrow-left" onClick={() => goTo(0)} className="self-start">
              Back
            </Button>
          </>
        )}

        {step === 2 && <ConnectStoreForm onBack={() => goTo(1)} initialError={initialError} reconnectValues={reconnectValues} />}
      </section>
    </div>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-3 text-sm">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2 last:flex-none" aria-current={active ? 'step' : undefined}>
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                done ? 'border-blue-600 bg-blue-600 text-white' : active ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black' : 'border-zinc-300 text-zinc-500'
              }`}
            >
              {done ? '✓' : i + 1}
            </span>
            <span className={done ? 'text-blue-600' : active ? 'font-medium' : 'text-zinc-500'}>{label}</span>
            {i < STEPS.length - 1 && <span className={`h-px flex-1 ${done ? 'bg-blue-600' : 'bg-zinc-300'}`} />}
          </li>
        );
      })}
    </ol>
  );
}

function Intro({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-zinc-500">{children}</p>
    </div>
  );
}

function Instruction({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3 text-sm">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-xs">{n}</span>
      {/* Plain block (not flex), so text, links and <strong> flow on one line. */}
      <div className="min-w-0 flex-1 leading-6">{children}</div>
    </li>
  );
}

function CopyBlock({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked (e.g. insecure context). The text can still be selected by hand.
    }
  };

  return (
    <div className="mt-2 flex items-start gap-2 rounded bg-zinc-100 p-3 font-mono text-xs dark:bg-zinc-900">
      <span className="min-w-0 flex-1 whitespace-pre-wrap break-all">{value}</span>
      <button type="button" onClick={copy} className="shrink-0 text-zinc-600 hover:underline">
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
