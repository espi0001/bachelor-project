'use client';
/** Right side of the site header: log in / sign up when signed out, or the organization switcher and user menu when signed in. */

import Link from "next/link";
import { OrganizationSwitcher, useAuth } from "@clerk/nextjs";
import { SIGN_IN_URL, SIGN_UP_URL } from "@/lib/auth-routes";
import { UserMenu } from "./user-menu";

// Client-side on purpose: the header lives in the root layout, which Next.js does not re-render on client
// navigation. useAuth() updates right after sign-in, sign-out and choosing an organization.
export function HeaderActions() {
  const { isLoaded, isSignedIn } = useAuth();

  // Render nothing until Clerk knows the state, so signed-in users never see the log in / sign up buttons flash.
  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <div className="flex items-center gap-2 sm:gap-4">
        <Link
          href={SIGN_IN_URL}
          className="rounded-md px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Log in
        </Link>
        <Link
          href={SIGN_UP_URL}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      {/* A personal account cannot have a store, so only organizations are shown. */}
      <OrganizationSwitcher
        hidePersonal
        afterSelectOrganizationUrl="/dashboard"
        afterCreateOrganizationUrl="/dashboard"
      />
      <UserMenu />
    </div>
  );
}
