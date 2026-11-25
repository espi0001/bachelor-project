'use client';
/** "Manage" button that opens Clerk's organization profile, where invites, roles and removals are handled. */

import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function ManageButton() {
  const { openOrganizationProfile } = useClerk();

  return (
    // "Manage" alone is vague to a screen reader user who jumps between buttons.
    <Button
      variant="secondary"
      aria-label="Manage organization"
      onClick={() => openOrganizationProfile()}
    >
      Manage
    </Button>
  );
}
