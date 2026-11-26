/** Desktop sidebar (Figma Sidebar 176:1554): logo, links to the main pages with the current one marked Active, and the footer. */

import type { IconName } from "@/components/ui/icon";
import { Brand } from "./brand";
import { NavItem } from "./nav-item";
import { SidebarFooter } from "./sidebar-footer";

// The pages that show the sidebar instead of the top header (see site-navigation.tsx).
export const NAV_ITEMS: { href: string; icon: IconName; label: string }[] = [
  { href: "/overview", icon: "overview", label: "Overview" },
  { href: "/products", icon: "products", label: "Products" },
  { href: "/approval", icon: "check-circle", label: "Approval" },
  { href: "/settings", icon: "settings", label: "Settings" },
];

// A prefix match, so a sub-page like /products/123 keeps Products active.
export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// As wide as its widest item (w-max), like the hug-contents sidebar in Figma, so a longer label
// such as "Channels and requirements" widens it. The root layout's <body> becomes a row when the
// sidebar is on the page (data-sidebar), and sticky keeps it in view while the page scrolls.
export function Sidebar({ pathname }: { pathname: string }) {
  return (
    <aside
      data-sidebar
      className="sticky top-0 hidden h-dvh w-max shrink-0 flex-col justify-between self-start overflow-y-auto border-r border-default bg-surface px-4 py-6 md:flex dark:border-white/15 dark:bg-zinc-950"
    >
      <div className="flex flex-col gap-1">
        <Brand variant="desktop" className="pb-6 pl-2" />
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
