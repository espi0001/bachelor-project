/**
 * Button appearance from the Figma style guide (Button/Primary 153:572, Button/Secondary 153:574, Back 207:2154).
 * Shared by `Button` (acts) and `ButtonLink` (navigates), so the two cannot look different.
 */

export const BUTTON_VARIANTS = ["primary", "secondary", "tertiary"] as const;
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

// Tailwind v4 gives <button> the default arrow cursor (only links get the hand), so set it here.
const BASE_CLASSES = [
  "inline-flex cursor-pointer items-center justify-center whitespace-nowrap typography-label",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-instant-blue",
  "disabled:cursor-not-allowed disabled:opacity-40",
].join(" ");

// Both filled variants have a 1px border, so the padding is 1px less than Figma's 16/10 to keep
// the button 40px high (Figma draws the stroke inside, CSS adds it outside). With only an
// 18px icon, 10px padding keeps it a 40px square.
const FILLED_CLASSES = "gap-2 rounded-md border";
const FILLED_PADDING = {
  text: "px-3.75 py-2.25",
  iconOnly: "p-2.5",
} as const;

// Figma has no hover state. Primary goes darker, secondary gets a grey fill and a darker border.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: `${FILLED_CLASSES} border-transparent bg-brand text-on-brand hover:bg-brand-hover`,
  secondary: `${FILLED_CLASSES} border-default bg-surface text-primary shadow-sm hover:border-zinc-300 hover:bg-zinc-50`,
  // Text only, like the Back link in Figma. `rounded-sm` keeps the focus outline from being a sharp box.
  tertiary:
    "gap-1 rounded-sm text-secondary hover:text-primary dark:text-zinc-400 dark:hover:text-zinc-200",
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
