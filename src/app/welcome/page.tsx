/**
 * Welcome page after sign-up (Figma "O5 · Welcome", 207:1840): asks the user to connect a store, or skip it for now.
 */

import Link from "next/link";
import { ConnectStorePrompt } from "@/components/connect-store-prompt";

export const metadata = {
  title: "Welcome",
};

export default function WelcomePage() {
  return (
    <div className="flex justify-center md:pt-4">
      <div className="flex w-full max-w-160 flex-col items-start gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="typography-heading-page text-primary dark:text-zinc-100">Welcome to Instant · Images</h1>
          <p className="typography-body text-secondary dark:text-zinc-400">
            Connect your store so we can check your product images against the requirements from Google and Meta.
          </p>
        </div>
        <ConnectStorePrompt />
        {/* Skipping is allowed: pages that need a store show the same card until one is connected. */}
        <Link
          href="/overview"
          className="rounded-sm typography-label text-brand hover:underline focus-ring dark:text-blue-400"
        >
          Skip for now
        </Link>
      </div>
    </div>
  );
}
