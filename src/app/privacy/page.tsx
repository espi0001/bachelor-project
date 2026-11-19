/** Privacy Policy page: placeholder until the real policy is written. Linked from Clerk's sign-up consent checkbox. */

export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16">
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Instant Image is a student project in development. The full privacy policy, including what data we store and
        why, will be published here before the app is used with real customer data.
      </p>
    </main>
  );
}
