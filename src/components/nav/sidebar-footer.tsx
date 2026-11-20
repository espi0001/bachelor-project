'use client';
/** Bottom of the sidebar (Figma Sidebar footer 153:600): the active store (organization) switcher and the user menu. */

import { OrganizationSwitcher, SignOutButton, useUser } from "@clerk/nextjs";

// Clerk renders the switcher, so its parts are styled through `appearance` to look like Figma:
// a 20px brand square, the store name in secondary text and a small chevron.
const SWITCHER_APPEARANCE = {
  elements: {
    rootBox: "min-w-0",
    organizationSwitcherTrigger:
      "gap-2.5 rounded-md py-1 pl-0 pr-1 typography-body-sm text-secondary hover:bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-instant-blue dark:text-zinc-400",
    organizationPreviewAvatarBox: "size-5 rounded-sm bg-brand",
    organizationPreviewMainIdentifier: "typography-body-sm text-secondary dark:text-zinc-400",
    organizationSwitcherTriggerIcon: "size-3 text-secondary",
  },
};

const MENU_ITEM_CLASS =
  "block w-full cursor-pointer rounded-md px-3 py-2 text-left typography-body-sm text-primary hover:bg-subtle focus-visible:bg-subtle focus-visible:outline-none dark:text-zinc-100 dark:hover:bg-white/10 dark:focus-visible:bg-white/10";

export function SidebarFooter() {
  return (
    <div className="flex h-7 w-full items-center justify-between gap-2 pl-2">
      {/* A personal account cannot have a store, so only organizations are shown. */}
      <OrganizationSwitcher
        hidePersonal
        afterSelectOrganizationUrl="/dashboard"
        afterCreateOrganizationUrl="/dashboard"
        appearance={SWITCHER_APPEARANCE}
      />
      <AvatarMenu />
    </div>
  );
}

function getInitials(firstName: string | null | undefined, lastName: string | null | undefined, email: string | undefined) {
  const initials = `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`;
  return (initials || email?.charAt(0) || "?").toUpperCase();
}

// The menu sits at the bottom of the screen, so it opens upwards.
// focus-within keeps it open while the user tabs through it with the keyboard.
function AvatarMenu() {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const name = user?.fullName ?? email ?? "Account";

  return (
    <div className="group relative shrink-0">
      <button
        type="button"
        aria-label={`Account menu for ${name}`}
        className="flex size-7 cursor-pointer items-center justify-center rounded-xl bg-zinc-800 typography-label text-on-brand hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-instant-blue dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:focus-visible:outline-blue-400"
      >
        {getInitials(user?.firstName, user?.lastName, email)}
      </button>

      <div className="invisible absolute bottom-full right-0 z-10 pb-2 opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <div className="w-44 rounded-lg border border-default bg-surface p-1 shadow-lg dark:border-white/15 dark:bg-zinc-900">
          <p className="truncate px-3 py-2 typography-caption text-secondary">{name}</p>
          <SignOutButton>
            <button type="button" className={MENU_ITEM_CLASS}>
              Log out
            </button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
