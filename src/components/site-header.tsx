'use client';
/** Top navigation (the landing page variant): the Instant Image logo and the auth actions. */

import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { HeaderActions } from "./header-actions";

export function SiteHeader({ className }: { className?: string }) {
  return (
    <header className={`border-b border-black/10 dark:border-white/15 ${className ?? ""}`}>
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <Logo />
          Instant Image
        </Link>
        <HeaderActions />
      </div>
    </header>
  );
}
