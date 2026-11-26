/** The overview table's status filter, sort, and page, read from and written to the URL. */

import type { Product } from "@/lib/shopify/products";

export const STATUS_FILTERS = ["all", "active", "draft", "archived", "unlisted"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export const SORT_COLUMNS = ["product", "images"] as const;
export type SortColumn = (typeof SORT_COLUMNS)[number];
export type SortDirection = "asc" | "desc";

export type OverviewQuery = {
  page: number;
  status: StatusFilter;
  sort: SortColumn | null;
  direction: SortDirection;
};

const PRODUCT_STATUS = {
  active: "ACTIVE",
  draft: "DRAFT",
  archived: "ARCHIVED",
  unlisted: "UNLISTED",
} as const satisfies Record<Exclude<StatusFilter, "all">, Product["status"]>;

export const STATUS_LABEL: Record<Product["status"], string> = {
  ACTIVE: "Active",
  DRAFT: "Draft",
  ARCHIVED: "Archived",
  UNLISTED: "Unlisted",
};

export const FILTER_LABEL: Record<StatusFilter, string> = {
  all: "All",
  active: "Active",
  draft: "Draft",
  archived: "Archived",
  unlisted: "Unlisted",
};

type SearchValue = string | string[] | undefined;

export function overviewQueryFromSearch(search: {
  page?: SearchValue;
  status?: SearchValue;
  sort?: SearchValue;
  dir?: SearchValue;
}): OverviewQuery {
  const page = Number(first(search.page));
  const status = first(search.status);
  const sort = first(search.sort);
  const direction = first(search.dir);
  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    status: isStatusFilter(status) ? status : "all",
    sort: isSortColumn(sort) ? sort : null,
    direction: direction === "desc" ? "desc" : "asc",
  };
}

export function matchesStatus(status: Product["status"], filter: StatusFilter): boolean {
  return filter === "all" || PRODUCT_STATUS[filter] === status;
}

/** Keeps the non-default parts of the query. Page 1, All, and the default sort stay out of the URL. */
export function overviewHref(query: OverviewQuery): string {
  const params = new URLSearchParams();
  if (query.status !== "all") params.set("status", query.status);
  if (query.sort) {
    params.set("sort", query.sort);
    params.set("dir", query.direction);
  }
  if (query.page > 1) params.set("page", String(query.page));
  const search = params.toString();
  return `${search ? `/overview?${search}` : "/overview"}#issues`;
}

function first(value: SearchValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function isStatusFilter(value: string | undefined): value is StatusFilter {
  return STATUS_FILTERS.some((status) => status === value);
}

function isSortColumn(value: string | undefined): value is SortColumn {
  return SORT_COLUMNS.some((column) => column === value);
}
