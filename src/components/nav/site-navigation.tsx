'use client';
/** Picks the navigation for the current page: the sidebar on the app pages, the top header everywhere else. */

import { usePathname } from "next/navigation";
import { SIGN_IN_URL, SIGN_UP_URL } from "@/lib/auth-routes";
import { SiteHeader } from "@/components/site-header";
import { NAV_ITEMS, Sidebar, isActivePath } from "./sidebar";

export function SiteNavigation() {
  const pathname = usePathname();

  // Clerk's sign-in and sign-up forms stand alone.
  if (pathname.startsWith(SIGN_IN_URL) || pathname.startsWith(SIGN_UP_URL)) return null;

  const hasSidebar = NAV_ITEMS.some((item) => isActivePath(pathname, item.href));
  if (!hasSidebar) return <SiteHeader />;

  // The sidebar is desktop only. On small screens the header stays until the mobile top bar (BA-181) replaces it.
  return (
    <>
      <Sidebar pathname={pathname} />
      <SiteHeader className="md:hidden" />
    </>
  );
}
