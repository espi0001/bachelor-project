/** Terms of Service page: placeholder until the real terms are written. Linked from Clerk's sign-up consent checkbox. */

export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16">
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Instant Image is a student project in development. The full terms of service will be published here before the
        app is used with real customer data.
      </p>
    </main>
  );
}
