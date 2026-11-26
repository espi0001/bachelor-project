/**
 * The card shell every section of the Settings page uses (Figma "Butik", 196:1640):
 * a heading, a short description, an optional status on the right and the section's content.
 */

import type { ReactNode } from "react";

type SettingsCardProps = {
  title: string;
  description: string;
  /** Shown to the right of the heading, e.g. a `Badge`. */
  status?: ReactNode;
  children: ReactNode;
};

export function SettingsCard({ title, description, status, children }: SettingsCardProps) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-default bg-surface p-5 shadow-sm dark:border-white/15 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="typography-heading-section text-primary dark:text-zinc-100">{title}</h2>
          <p className="typography-body-sm text-secondary dark:text-zinc-400">{description}</p>
        </div>
        {status ? <div className="shrink-0">{status}</div> : null}
      </div>
      {children}
    </section>
  );
}
