/**
 * Button appearance from the Figma component set Button (223:1899): Primary, Secondary and Tertiary,
 * each with Default, Hover and Disabled. Shared by `Button` (acts) and `ButtonLink` (navigates).
 */

export const BUTTON_VARIANTS = ["primary", "secondary", "tertiary"] as const;
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

// Tailwind v4 gives <button> the default arrow cursor (only links get the hand), so set it here.
// Hover styles use `not-disabled:` so a disabled button keeps its disabled look under the mouse.
const BASE_CLASSES = [
  "inline-flex cursor-pointer items-center justify-center whitespace-nowrap typography-label",
  // Brand blue has only 2.9:1 contrast on the dark page, below WCAG AA's 3:1, so dark mode uses blue-400 (7.5:1).
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-instant-blue dark:focus-visible:outline-blue-400",
  "disabled:cursor-not-allowed",
].join(" ");

// Both filled variants have a 1px border, so the padding is 1px less than Figma's 16/10 to keep
// the button 40px high (Figma draws the stroke inside, CSS adds it outside). With only an
// 18px icon, 10px padding keeps it a 40px square.
const FILLED_CLASSES = "gap-2 rounded-md border";
const FILLED_PADDING = {
  text: "px-3.75 py-2.25",
  iconOnly: "p-2.5",
} as const;

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // Figma's disabled primary is the brand fill and white label both at 50%, the same as opacity-50.
  primary: `${FILLED_CLASSES} border-transparent bg-brand text-on-brand not-disabled:hover:bg-brand-hover disabled:opacity-50`,
  // bg-subtle is see-through (5% black). Dark mode keeps the white button and dark label (Figma has
  // no dark mode), so hover there needs an opaque fill or the label vanishes into the dark page.
  // zinc-100 is about what 5% black over white looks like.
  secondary: `${FILLED_CLASSES} border-default bg-surface text-primary shadow-sm not-disabled:hover:bg-subtle dark:not-disabled:hover:bg-zinc-100 disabled:border-subtle disabled:text-muted`,
  // Text only, like the Back link in Figma. `rounded-sm` keeps the focus outline from being a sharp box.
  tertiary: [
    "gap-1 rounded-sm text-secondary not-disabled:hover:text-primary not-disabled:hover:underline",
    "disabled:text-muted dark:text-zinc-400 dark:not-disabled:hover:text-zinc-200 dark:disabled:text-zinc-600",
  ].join(" "),
};

/** The complete class list for an element that looks like a button. */
export function getButtonClassName({
  variant,
  isIconOnly = false,
  className,
}: {
  variant: ButtonVariant;
  isIconOnly?: boolean;
  className?: string;
}): string {
  const padding =
    variant === "tertiary"
      ? undefined
      : FILLED_PADDING[isIconOnly ? "iconOnly" : "text"];

  return [BASE_CLASSES, VARIANT_CLASSES[variant], padding, className]
    .filter(Boolean)
    .join(" ");
}
