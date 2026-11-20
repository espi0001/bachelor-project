/**
 * A button: something that acts. If the control navigates, use `ButtonLink` instead;
 * both get their look from button-styles.ts and their inside from button-content.tsx.
 */

import type { ComponentProps } from "react";
import {
  ButtonContent,
  type ButtonContentProps,
} from "@/components/ui/button-content";
import {
  getButtonClassName,
  type ButtonVariant,
} from "@/components/ui/button-styles";

type ButtonProps = Omit<ComponentProps<"button">, "children" | "aria-label"> &
  ButtonContentProps & {
    variant?: ButtonVariant;
  };

/** Defaults to `type="button"`, so a button in a form does not submit it by accident. */
export function Button({
  variant = "primary",
  type = "button",
  className,
  children,
  leadingIcon,
  trailingIcon,
  icon,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={getButtonClassName({
        variant,
        isIconOnly: icon !== undefined,
        className,
      })}
      {...props}
    >
      <ButtonContent
        {...(icon ? { icon } : { children, leadingIcon, trailingIcon })}
      />
    </button>
  );
}
