/** Products with image issues, filtered by status and sorted from the column headers. */

import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { Icon } from "@/components/ui/icon";
import { productUrlId, type Product } from "@/lib/shopify/products";
import { issueLabel, type ImageIssue } from "./image-requirements";
import {
  FILTER_LABEL,
  STATUS_LABEL,
  matchesStatus,
  overviewHref,
  type OverviewQuery,
  type SortColumn,
} from "./overview-query";
import { StatusFilter } from "./status-filter";

const PAGE_SIZE = 20;

type IssueRow = {
  product: Product;
  issues: ImageIssue[];
};

type IssuesTableProps = {
  rows: IssueRow[];
  query: OverviewQuery;
};

export function IssuesTable({ rows, query }: IssuesTableProps) {
  const matched = rows.filter((row) => matchesStatus(row.product.status, query.status)).sort(compareRows(query));
  const pageCount = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
  const currentPage = Math.min(query.page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = matched.slice(start, start + PAGE_SIZE);
  const from = matched.length === 0 ? 0 : start + 1;
  const to = start + visible.length;

  return (
    <div id="issues" className="scroll-mt-20 overflow-x-auto rounded-lg border border-default dark:border-white/15">
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="issues-heading" className="typography-heading-section text-primary dark:text-zinc-100">
          Products with issues
        </h2>
        <StatusFilter query={query} />
      </div>
      <table aria-labelledby="issues-heading" className="w-full text-left">
        <thead className="bg-subtle text-secondary dark:bg-zinc-900 dark:text-zinc-400">
          <tr>
            <SortHeader column="product" label="Product" query={query} />
            <th scope="col" className="px-4 py-3 font-medium">Status</th>
            <SortHeader column="images" label="Images" query={query} />
            <th scope="col" className="px-4 py-3 font-medium">Issue</th>
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {visible.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-secondary dark:text-zinc-400">
                {emptyMessage(query)}
              </td>
            </tr>
          ) : (
            visible.map(({ product, issues }) => (
              <tr key={product.id} className="border-t border-default dark:border-white/15">
                <th scope="row" className="px-4 py-4 font-medium text-primary dark:text-zinc-100">
                  {product.title}
                </th>
                <td className="px-4 py-4 text-secondary dark:text-zinc-400">{STATUS_LABEL[product.status]}</td>
                <td className="px-4 py-4 text-primary dark:text-zinc-100">{product.images.length}</td>
                <td className="px-4 py-4 text-secondary dark:text-zinc-400">{issueLabel(issues)}</td>
                <td className="px-4 py-4 text-right">
                  <ButtonLink href={`/products/${productUrlId(product.id)}`} variant="secondary">
                    Open
                    <span className="sr-only"> {product.title}</span>
                  </ButtonLink>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <nav aria-label="Issues pages" className="flex items-center justify-between gap-3 border-t border-default px-4 py-3 dark:border-white/15">
        <p className="typography-body-sm text-secondary dark:text-zinc-400">
          Showing {from}–{to} of {matched.length}
        </p>
        <div className="flex gap-2">
          <PageLink query={{ ...query, page: currentPage - 1 }} enabled={currentPage > 1}>
            Previous
          </PageLink>
          <PageLink query={{ ...query, page: currentPage + 1 }} enabled={currentPage < pageCount}>
            Next
          </PageLink>
        </div>
      </nav>
    </div>
  );
}

function SortHeader({ column, label, query }: { column: SortColumn; label: string; query: OverviewQuery }) {
  const active = query.sort === column;
  const nextDirection = active && query.direction === "asc" ? "desc" : "asc";
  return (
    <th
      scope="col"
      aria-sort={active ? (query.direction === "asc" ? "ascending" : "descending") : "none"}
      className="px-4 py-3 font-medium"
    >
      <Link
        href={overviewHref({ ...query, sort: column, direction: nextDirection, page: 1 })}
        className="inline-flex items-center gap-1 rounded-sm hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-instant-blue dark:hover:text-zinc-100 dark:focus-visible:outline-blue-400"
      >
        {label}
        {active ? (
          <Icon name="sort-chevron-down" size="xs" className={query.direction === "asc" ? "rotate-180" : undefined} />
        ) : null}
      </Link>
    </th>
  );
}

function PageLink({ query, enabled, children }: { query: OverviewQuery; enabled: boolean; children: string }) {
  if (!enabled) {
    return <span className="typography-body-sm text-muted dark:text-zinc-500">{children}</span>;
  }
  return (
    <ButtonLink href={overviewHref(query)} variant="secondary">
      {children}
    </ButtonLink>
  );
}

function compareRows(query: OverviewQuery) {
  return (a: IssueRow, b: IssueRow) => {
    if (!query.sort) {
      return issueRank(a.issues) - issueRank(b.issues) || a.product.title.localeCompare(b.product.title);
    }
    const direction = query.direction === "asc" ? 1 : -1;
    const primary =
      query.sort === "product"
        ? a.product.title.localeCompare(b.product.title)
        : a.product.images.length - b.product.images.length;
    return primary * direction || a.product.title.localeCompare(b.product.title);
  };
}

function issueRank(issues: ImageIssue[]): number {
  return issues.some((issue) => issue.severity === "error") ? 0 : 1;
}

function emptyMessage(query: OverviewQuery): string {
  if (query.status === "all") return "No products have image issues.";
  return `No ${FILTER_LABEL[query.status].toLowerCase()} products have image issues.`;
}
