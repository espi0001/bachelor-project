/**
 * Card link to /connect-store (Figma "Connect your store", 207:1874). Used on the welcome page
 * and on pages that need a store when the user skipped connecting one.
 */

import Link from "next/link";
import { Icon } from "@/components/ui/icon";

type ConnectStorePromptProps = {
  /** The second line: what connecting gives the user on this page. */
  description: string;
};

export function ConnectStorePrompt({ description }: ConnectStorePromptProps) {
  return (
    <Link
      href="/connect-store"
      className="group flex w-full items-center gap-3 rounded-lg border border-default bg-surface p-6 hover:bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-instant-blue dark:border-white/15 dark:bg-zinc-950 dark:hover:bg-zinc-900 dark:focus-visible:outline-blue-400"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-subtle text-primary dark:bg-white/10 dark:text-zinc-100">
        <Icon name="products" className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="typography-label text-primary group-hover:underline dark:text-zinc-100">Connect your store</span>
        <span className="typography-body-sm text-secondary dark:text-zinc-400">{description}</span>
      </span>
      <Icon name="arrow-right" size="sm" className="text-primary dark:text-zinc-100" />
    </Link>
  );
}
