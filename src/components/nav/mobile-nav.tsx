'use client';
/** Mobile navigation: the top bar (Figma Top bar 222:4150) with a burger button that slides in the menu panel (Figma M0 · Menu 162:1179). */

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Brand } from "./brand";
import { NavItem } from "./nav-item";
import { NAV_ITEMS, isActivePath } from "./sidebar";
import { SidebarFooter } from "./sidebar-footer";

const ICON_BUTTON_CLASS =
  "flex cursor-pointer items-center justify-center rounded-md p-1.5 text-secondary hover:bg-subtle hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-instant-blue dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100 dark:focus-visible:outline-blue-400";

// The panel stays mounted so it can slide out again. `invisible` hides it from the keyboard and
// screen readers when closed; visibility is in the transition so it only hides after the slide.
const PANEL_STATE_CLASSES = {
  open: "visible translate-x-0",
  closed: "invisible translate-x-full",
} as const;

export function MobileNav({ pathname }: { pathname: string }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // The open panel covers the burger button, so focus goes back to it when the menu closes.
  function closeMenu() {
    setIsMenuOpen(false);
    menuButtonRef.current?.focus();
  }

  // While open: focus the close button, and close on Escape or a click outside the panel.
  useEffect(() => {
    if (!isMenuOpen) return;
    closeButtonRef.current?.focus();

    function handleClickOutside(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element) || menuRef.current?.contains(target)) return;
      // Clerk may render the store switcher and user button popovers outside the panel.
      // A click in them is still a click in the menu. All Clerk elements have a `cl-` class.
      if (target.closest('[class*="cl-"]')) return;
      setIsMenuOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setIsMenuOpen(false);
      menuButtonRef.current?.focus();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <nav aria-label="Main" className="md:hidden">
      <div className="flex h-14 items-center justify-between border-b border-default bg-surface px-4 dark:border-white/15 dark:bg-zinc-950">
        <Brand variant="mobile" />
        <button
          ref={menuButtonRef}
          type="button"
          aria-label="Open menu"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          onClick={() => setIsMenuOpen(true)}
          className={ICON_BUTTON_CLASS}
        >
          <Icon name="menu-mobile" />
        </button>
      </div>

      {/* Full width on phones as in Figma. From sm up it is a panel on the right, so there is an outside to click. */}
      <div
        ref={menuRef}
        id="mobile-menu"
        className={`fixed inset-y-0 right-0 z-30 flex w-full flex-col gap-1 overflow-y-auto bg-surface p-4 shadow-modal transition-[translate,visibility] duration-800 ease-[cubic-bezier(0.76,0,0.24,1)] motion-reduce:transition-none sm:max-w-sm dark:bg-zinc-950 ${PANEL_STATE_CLASSES[isMenuOpen ? "open" : "closed"]}`}
      >
        <div className="flex items-center justify-between pb-4 pt-1">
          {/* <Brand variant="mobile" /> */}
          <button ref={closeButtonRef} type="button" aria-label="Close menu" onClick={closeMenu} className={ICON_BUTTON_CLASS}>
            <Icon name="close" />
          </button>
        </div>
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <NavItem {...item} isActive={isActivePath(pathname, item.href)} onClick={() => setIsMenuOpen(false)} />
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-4">
          <SidebarFooter />
        </div>
      </div>
    </nav>
  );
}
