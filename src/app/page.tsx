/** Front page: introduces Instant Image and links to sign up / log in, or to the dashboard when signed in. */

import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { SIGN_IN_URL, SIGN_UP_URL } from "@/lib/auth-routes";

const primaryButton =
  "flex h-12 items-center justify-center rounded-md bg-green-600 px-8 font-medium text-white hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2";
const secondaryButton =
  "flex h-12 items-center justify-center rounded-md border border-black/15 px-8 font-medium hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white/20 dark:hover:bg-zinc-900";

  // TODO: Make a frontpage design
export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 py-8">
      <p className="mb-8 inline-flex items-center gap-3 rounded-full border border-black/10 px-4 py-2 text-xs font-medium uppercase tracking-wider text-zinc-600 dark:border-white/15 dark:text-zinc-400">
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-indigo-600" />
        Product image review
      </p>

      <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
        Product images you can trust.{" "}
        <em className="text-zinc-500 dark:text-zinc-400">Get ready with Instant Image.</em>
      </h1>

      <p className="mt-8 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
        Connect your Shopify store and see every product image in one place, with its size and alt text, so you can
        review them before your customers do.
      </p>

      <div className="mt-10">
        <Suspense>
          <CallToAction />
        </Suspense>
      </div>
    </div>
  );
}

// auth() is dynamic, so it must render inside Suspense (cacheComponents).
async function CallToAction() {
  const { userId } = await auth();

  if (userId) {
    return (
      <Link href="/dashboard" className={`${primaryButton} w-fit`}>
        Go to dashboard
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
      <Link href={SIGN_UP_URL} className={primaryButton}>
        Sign up
      </Link>
      <Link href={SIGN_IN_URL} className={secondaryButton}>
        Log in
      </Link>
    </div>
  );
}
