/** Sign-up page: Clerk's sign-up form, also used for session tasks such as creating an organization. */

import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";

export const metadata = {
  title: "Sign up",
};

export default function SignUpPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-8">
      {/* SignUp reads the URL (usePathname), so it must render inside Suspense (cacheComponents). */}
      <Suspense>
        <SignUp />
      </Suspense>
    </main>
  );
}
