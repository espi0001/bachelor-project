"use client";
/** Dropdown that filters the overview issue table by product status. */

import { useRouter } from "next/navigation";
import { FILTER_LABEL, STATUS_FILTERS, isStatusFilter, overviewHref, type OverviewQuery } from "./overview-query";

export function StatusFilter({ query }: { query: OverviewQuery }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="issue-status" className="typography-body-sm text-secondary dark:text-zinc-400">
        Filter
      </label>
      <select
        id="issue-status"
        value={query.status}
        onChange={(event) => {
          const status = event.target.value;
          if (!isStatusFilter(status)) return;
          router.push(overviewHref({ ...query, status, page: 1 }), { scroll: false });
        }}
        className="rounded-md border border-default bg-surface px-2 py-1 text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-instant-blue dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-100 dark:focus-visible:outline-blue-400"
      >
        {STATUS_FILTERS.map((status) => (
          <option key={status} value={status}>
            {FILTER_LABEL[status]}
          </option>
        ))}
      </select>
    </div>
  );
}
