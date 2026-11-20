/**
 * Root layout: wraps the app in ClerkProvider with the auth redirects, and shows the navigation for the page (sidebar or top header).
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Suspense } from "react";
import { SIGN_IN_URL, SIGN_UP_URL } from "@/lib/auth-routes";
import { SiteNavigation } from "@/components/nav/site-navigation";
import "./globals.css";

// The style guide font. Self-hosted by next/font, so it looks the same on every OS.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s · Instant Image",
    default: "Instant Image",
  },
  description: "Review product images from a connected Shopify store.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      {/* The sidebar is fixed to the left, so the body makes room for it on desktop when it is on the page. */}
      <body className="min-h-full flex flex-col md:has-[[data-sidebar]]:pl-60">
        {/* Every sign-in and sign-up goes through /dashboard, which sends the user on to /products or /connect-store. Logout returns to the front page. */}
        <ClerkProvider
          signInUrl={SIGN_IN_URL}
          signUpUrl={SIGN_UP_URL}
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
          afterSignOutUrl="/"
          // Brand blue (--color-instant-blue) on buttons and links in Clerk's forms. Clerk needs the hex value.
          appearance={{ variables: { colorPrimary: "#0f3bfe" } }}
        >
          {/* SiteNavigation reads the URL (usePathname), so it must render inside Suspense (cacheComponents). */}
          <Suspense>
            <SiteNavigation />
          </Suspense>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
