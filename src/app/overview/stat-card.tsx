/** One overview figure: a label, a number and a short explanation. */

type StatCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <section className="flex flex-col gap-1 rounded-lg border border-default bg-surface p-4 dark:border-white/15 dark:bg-zinc-950">
      <h2 className="typography-body-sm text-secondary dark:text-zinc-400">{label}</h2>
      <p className="typography-heading-page text-primary dark:text-zinc-100">{value}</p>
      <p className="typography-body-sm text-muted dark:text-zinc-500">{detail}</p>
    </section>
  );
}
