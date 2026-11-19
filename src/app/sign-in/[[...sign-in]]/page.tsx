/** Sign-in page: Clerk's sign-in form, also used for session tasks such as choosing an organization. */

import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";

export const metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-8">
      {/* SignIn reads the URL (usePathname), so it must render inside Suspense (cacheComponents). */}
      <Suspense>
        <SignIn />
      </Suspense>
    </main>
  );
}
