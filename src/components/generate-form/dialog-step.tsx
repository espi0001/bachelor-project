/**
 * The layout of one view in the generate dialog: fixed content above and below a scrolling list, and a fixed button row.
 */

import type { ReactNode } from "react";

export function DialogStep({
  top,
  bottom,
  footer,
  scrollLabel,
  children,
}: {
  /** Fixed above the list, e.g. a heading and intro text. */
  top?: ReactNode;
  /** Fixed below the list, e.g. an info box. */
  bottom?: ReactNode;
  /** The button row at the bottom of the dialog. */
  footer: ReactNode;
  /**
   * Set only when the list has nothing focusable. The scroll area then becomes a labelled tab stop,
   * so keyboard users can scroll it; Safari does not make scroll areas focusable on its own.
   */
  scrollLabel?: string;
  /** The list. It scrolls when it is taller than the space between top and bottom. */
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {top && <div className="shrink-0 pb-3">{top}</div>}

      {/* min-h-24 keeps the list visible on very low screens; the dialog itself scrolls instead.
          The negative margin and padding leave room for focus outlines, which the scroll area would otherwise cut off. */}
      <div
        className="-mx-1 min-h-24 flex-1 overflow-y-auto px-1 py-1 focus-ring"
        {...(scrollLabel ? { tabIndex: 0, role: "region", "aria-label": scrollLabel } : {})}
      >
        {children}
      </div>

      {bottom && <div className="shrink-0 pt-4">{bottom}</div>}

      <div className="mt-6 shrink-0 border-t border-default pt-6">{footer}</div>
    </div>
  );
}
