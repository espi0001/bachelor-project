/**
 * The inside of `Button` and `ButtonLink`: an optional icon before and after the label, or one icon alone.
 * Renders no wrapper, so all styling stays on the <button> or <a> from button-styles.ts.
 */

import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";

/**
 * Either a label with optional icons, or only an icon. A button with only an icon has no
 * visible text, so `aria-label` is required there to give it a name for screen readers.
 */
export type ButtonContentProps =
  | {
      children: ReactNode;
      leadingIcon?: IconName;
      trailingIcon?: IconName;
      icon?: never;
      "aria-label"?: string;
    }
  | {
      icon: IconName;
      "aria-label": string;
      children?: never;
      leadingIcon?: never;
      trailingIcon?: never;
    };

export function ButtonContent({
  children,
  leadingIcon,
  trailingIcon,
  icon,
}: Omit<ButtonContentProps, "aria-label">) {
  if (icon) {
    return <Icon name={icon} size="sm" />;
  }

  return (
    <>
      {leadingIcon && <Icon name={leadingIcon} size="sm" />}
      {children}
      {trailingIcon && <Icon name={trailingIcon} size="sm" />}
    </>
  );
}
