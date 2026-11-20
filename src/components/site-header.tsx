'use client';
/** Site header: the Instant Image logo and the auth actions. Hidden on the sign-in and sign-up pages, where Clerk's form stands alone. */

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SIGN_IN_URL, SIGN_UP_URL } from "@/lib/auth-routes";
import { HeaderActions } from "./header-actions";

export function SiteHeader() {
  const pathname = usePathname();
  if (pathname.startsWith(SIGN_IN_URL) || pathname.startsWith(SIGN_UP_URL)) return null;

  return (
    <header className="border-b border-black/10 dark:border-white/15">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <Image src="/logo.svg" alt="" width={28} height={28} priority />
          Instant Image
        </Link>
        <HeaderActions />
      </div>
    </header>
  );
}
