/**
 * Button appearance from the Figma style guide (Button/Primary 153:572, Button/Secondary 153:574, Back 207:2154).
 * Shared by `Button` (acts) and `ButtonLink` (navigates), so the two cannot look different.
 */

export const BUTTON_VARIANTS = ["primary", "secondary", "tertiary"] as const;
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

const BASE_CLASSES = [
  "inline-flex items-center justify-center whitespace-nowrap typography-label",
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

// Figma has no hover state, so hover only changes the colour a little.
// `not-disabled:` keeps a disabled button from reacting to hover. Not `enabled:`, because
// `:enabled` never matches an <a>, so `ButtonLink` would get no hover at all.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: `${FILLED_CLASSES} border-transparent bg-brand text-on-brand not-disabled:hover:bg-brand/90`,
  secondary: `${FILLED_CLASSES} border-default bg-surface text-primary shadow-sm not-disabled:hover:bg-subtle`,
  // Text only, like the Back link in Figma. `rounded-sm` keeps the focus outline from being a sharp box.
  tertiary: "gap-1 rounded-sm text-secondary not-disabled:hover:text-primary",
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
