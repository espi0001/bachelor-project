/**
 * The header at the top of a page: title, a short description and an optional action
 * (Figma "Header", 196:1631). Each page passes its own text and its own button.
 */

import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  /**
   * The page's main action, e.g. `<Button onClick={…}>Save changes</Button>`, a `ButtonLink`,
   * or a submit button with `form="…"`. A slot instead of label + onClick props, so a page can
   * use a link, a form submit or a client button without this component knowing which.
   */
  action?: ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    // Stacked on phones so a long description does not squeeze the button; one row from sm up as in Figma.
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h1 className="typography-heading-page text-primary">{title}</h1>
        {description ? (
          <p className="typography-body-sm text-secondary">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
