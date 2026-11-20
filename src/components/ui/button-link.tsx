/**
 * A link that looks like a button: something that navigates (e.g. "Open" on a product row).
 * If the control acts, use `Button` instead; both get their look from button-styles.ts.
 */

import Link from "next/link";
import type { ComponentProps } from "react";
import {
  ButtonContent,
  type ButtonContentProps,
} from "@/components/ui/button-content";
import {
  getButtonClassName,
  type ButtonVariant,
} from "@/components/ui/button-styles";

type ButtonLinkProps = Omit<
  ComponentProps<typeof Link>,
  "children" | "aria-label"
> &
  ButtonContentProps & {
    variant?: ButtonVariant;
  };

export function ButtonLink({
  variant = "primary",
  className,
  children,
  leadingIcon,
  trailingIcon,
  icon,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
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
    </Link>
  );
}
