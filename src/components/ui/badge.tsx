/**
 * A status badge from the Figma style guide (Badge/Success 153:576, Badge/Error 153:579, Badge/Warning 153:582).
 * Shows a short status, e.g. whether an image meets the requirements.
 */

import type { ReactNode } from "react";

export const BADGE_VARIANTS = ["success", "error", "warning"] as const;
export type BadgeVariant = (typeof BADGE_VARIANTS)[number];

// The glyph is a text layer in Figma, not an icon, so it takes the font's size and colour.
// `srLabel` gives screen readers the status that sighted users read from colour and glyph
// (WCAG 1.4.1: colour must not be the only way to tell the variants apart).
const VARIANTS: Record<
  BadgeVariant,
  { classes: string; glyph: string; srLabel: string }
> = {
  success: { classes: "bg-success text-success", glyph: "✓", srLabel: "Success:" },
  error: { classes: "bg-error text-error", glyph: "✕", srLabel: "Error:" },
  warning: { classes: "bg-warning text-warning", glyph: "!", srLabel: "Warning:" },
};

type BadgeProps = {
  variant: BadgeVariant;
  children: ReactNode;
};

export function Badge({ variant, children }: BadgeProps) {
  const { classes, glyph, srLabel } = VARIANTS[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md py-1 pr-2.5 pl-2 typography-label-sm ${classes}`}
    >
      <span aria-hidden="true">{glyph}</span>
      <span className="sr-only">{srLabel}</span>
      {children}
    </span>
  );
}
