/** Desktop sidebar (Figma Sidebar 176:1554): logo, links to the main pages with the current one marked Active, and the footer. */

import type { IconName } from "@/components/ui/icon";
import { Logo } from "@/components/ui/logo";
import { NavItem } from "./nav-item";
import { SidebarFooter } from "./sidebar-footer";

// The pages that show the sidebar instead of the top header (see site-navigation.tsx).
export const NAV_ITEMS: { href: string; icon: IconName; label: string }[] = [
  { href: "/overview", icon: "overview", label: "Overview" },
  { href: "/products", icon: "products", label: "Products" },
  { href: "/approval", icon: "check-circle", label: "Approval" },
  { href: "/channels", icon: "feeds", label: "Channels and requirements" },
  { href: "/settings", icon: "settings", label: "Settings" },
];

// A prefix match, so a sub-page like /products/123 keeps Products active.
export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Fixed to the left edge, so the page content does not have to be wrapped. The root layout's
// <body> makes room for it with padding when the sidebar is on the page (data-sidebar).
export function Sidebar({ pathname }: { pathname: string }) {
  return (
    <aside
      data-sidebar
      className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col justify-between overflow-y-auto border-r border-default bg-surface px-4 py-6 md:flex dark:border-white/15 dark:bg-zinc-950"
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5 pb-6 pl-2">
          <Logo />
          <span className="typography-heading-section whitespace-nowrap text-primary dark:text-zinc-100">
            Instant · Images
          </span>
        </div>
        <nav aria-label="Main">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <NavItem {...item} isActive={isActivePath(pathname, item.href)} />
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <SidebarFooter />
    </aside>
  );
}
