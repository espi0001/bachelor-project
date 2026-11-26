/** A sidebar link from the Figma style guide (Nav item 176:1377), with the states Default and Active. */

import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";

type NavItemProps = {
  href: string;
  icon: IconName;
  label: string;
  isActive: boolean;
  onClick?: () => void;
};

// Figma has no hover state. Hover uses the Active background, so it is clear the item is a link.
const STATE_CLASSES = {
  default: "typography-body-sm text-secondary hover:bg-subtle hover:text-primary dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100",
  active: "typography-label bg-subtle text-primary dark:bg-white/10 dark:text-zinc-100",
} as const;

export function NavItem({ href, icon, label, isActive, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={`flex w-full items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2.5 focus-ring ${STATE_CLASSES[isActive ? "active" : "default"]}`}
    >
      {/* Only the active icon is brand blue in Figma; the default icon follows the text colour. */}
      <Icon name={icon} size="xs" className={isActive ? "text-brand dark:text-blue-400" : undefined} />
      {label}
    </Link>
  );
}
