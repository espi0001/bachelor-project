'use client';
/** User menu in the header: shows the signed-in user and opens on hover or keyboard focus with links to the dashboard and logout. */

import Link from "next/link";
import { SignOutButton, useUser } from "@clerk/nextjs";

const itemClass =
  "block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:outline-none dark:hover:bg-zinc-800 dark:focus-visible:bg-zinc-800";

export function UserMenu() {
  const { user } = useUser();
  const name = user?.firstName ?? user?.primaryEmailAddress?.emailAddress ?? "Account";

  return (
    // focus-within keeps the menu open while the user tabs through it with the keyboard.
    <div className="group relative">
      <button
        type="button"
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-medium hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 dark:hover:bg-zinc-800"
      >
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold uppercase text-white"
        >
          {name.charAt(0)}
        </span>
        {name}
        <span aria-hidden="true" className="text-xs text-zinc-500">
          ▾
        </span>
      </button>

      <div className="invisible absolute right-0 top-full z-10 pt-2 opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <nav
          aria-label="User menu"
          className="w-44 rounded-lg border border-black/10 bg-background p-1 shadow-lg dark:border-white/15"
        >
          <Link href="/dashboard" className={itemClass}>
            Dashboard
          </Link>
          <SignOutButton>
            <button type="button" className={itemClass}>
              Log out
            </button>
          </SignOutButton>
        </nav>
      </div>
    </div>
  );
}
