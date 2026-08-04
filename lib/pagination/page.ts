import { PAGINATION } from "@/constants";
import { getQueryString, SearchParams } from "@/lib/filters/query";

export type PagePaginationInput = {
  page?: number | null;
  pageSize?: number | null;
  defaultPageSize?: number;
  maxPageSize?: number;
};

export function resolvePagePagination(input: PagePaginationInput = {}) {
  const maxPageSize = input.maxPageSize ?? PAGINATION.MAX_LIMIT;
  const defaultPageSize = input.defaultPageSize ?? PAGINATION.DEFAULT_LIMIT;
  const pageSize = Math.min(Math.max(input.pageSize ?? defaultPageSize, 1), maxPageSize);
  const page = Math.max(1, input.page ?? 1);
  const skip = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    limit: pageSize,
    skip,
    take: pageSize,
  };
}

export function resolvePagePaginationFromParams(
  searchParams: SearchParams,
  options?: { prefix?: string; defaultPageSize?: number; maxPageSize?: number },
) {
  const prefix = options?.prefix ?? "";
  const pageValue = getQueryString(searchParams, `${prefix}page`);
  const limitValue = getQueryString(searchParams, `${prefix}limit`);
  const parsedPage = pageValue ? Number(pageValue) : undefined;
  const parsedLimit = limitValue ? Number(limitValue) : undefined;

  return resolvePagePagination({
    page: Number.isFinite(parsedPage) ? parsedPage : undefined,
    pageSize: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    defaultPageSize: options?.defaultPageSize,
    maxPageSize: options?.maxPageSize,
  });
}

export function getTotalPages(totalItems: number, pageSize: number) {
  return Math.max(1, Math.ceil(Math.max(0, totalItems) / Math.max(1, pageSize)));
}

/** Reset list pagination when search/filters change. */
export function clearPaginationParams(next: URLSearchParams, prefix = "") {
  next.delete(`${prefix}cursor`);
  next.delete(`${prefix}stack`);
  next.delete(`${prefix}page`);
}
