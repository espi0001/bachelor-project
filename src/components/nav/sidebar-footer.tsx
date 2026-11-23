'use client';
/** Bottom of the sidebar and mobile menu (Figma Sidebar footer 153:600): the active store (organization) switcher and Clerk's user button. */

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";

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
      {/* Clerk's default look on purpose: the group chose not to restyle the avatar. */}
      <UserButton />
    </div>
  );
}
