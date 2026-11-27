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
      {/* On mobile there is no room to keep top and bottom fixed, so they scroll together with the list and only the
          footer stays. From sm up this wrapper does not scroll; the list below has its own scroll area. */}
      <div className="flex min-h-0 flex-1 flex-col max-sm:-mx-1 max-sm:overflow-y-auto max-sm:px-1">
        {top && <div className="shrink-0 pb-3">{top}</div>}

        {/* sm:min-h-24 keeps the list visible on low screens; the dialog itself scrolls instead.
            The negative margin and padding leave room for focus outlines, which a scroll area would otherwise cut off.
            On mobile a focused list still scrolls with the arrow keys, because the browser scrolls the wrapper around it. */}
        <div
          className="py-1 focus-ring sm:-mx-1 sm:min-h-24 sm:flex-1 sm:overflow-y-auto sm:px-1"
          {...(scrollLabel ? { tabIndex: 0, role: "region", "aria-label": scrollLabel } : {})}
        >
          {children}
        </div>

        {bottom && <div className="shrink-0 pt-4">{bottom}</div>}
      </div>

      <div className="mt-4 shrink-0 border-t border-default pt-4 sm:mt-6 sm:pt-6">{footer}</div>
    </div>
  );
}
