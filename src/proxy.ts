/** Runs Clerk on every request and sends signed-out users to sign-in on all pages except the public ones below. */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { SIGN_IN_URL, SIGN_UP_URL } from "@/lib/auth-routes";

// Front page, auth pages, the legal pages that the sign-up form links to,
// and the Clerk webhook (Clerk calls it without a session; the route checks the signature itself).
const isPublicRoute = createRouteMatcher([
  "/",
  `${SIGN_IN_URL}(.*)`,
  `${SIGN_UP_URL}(.*)`,
  "/terms",
  "/privacy",
  "/api/webhooks/clerk",
]);

export default clerkMiddleware(
  async (auth, req) => {
    if (!isPublicRoute(req)) await auth.protect();
  },
  { signInUrl: SIGN_IN_URL, signUpUrl: SIGN_UP_URL },
);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
