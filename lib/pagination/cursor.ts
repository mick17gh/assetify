import { PAGINATION } from "@/constants";
import { getQueryString, SearchParams } from "@/lib/filters/query";

export type CursorInput = {
  cursor?: string | null;
  limit?: number;
};

export function resolveCursorPagination(input: CursorInput) {
  const resolvedLimit = Math.min(
    Math.max(input.limit ?? PAGINATION.DEFAULT_LIMIT, 1),
    PAGINATION.MAX_LIMIT,
  );

  return {
    cursor: input.cursor ?? undefined,
    limit: resolvedLimit,
    take: resolvedLimit + 1,
  };
}

export function resolveCursorPaginationFromParams(searchParams: SearchParams, prefix = "") {
  const cursor = getQueryString(searchParams, `${prefix}cursor`) || undefined;
  const limitValue = getQueryString(searchParams, `${prefix}limit`);
  const parsedLimit = limitValue ? Number(limitValue) : undefined;
  return resolveCursorPagination({ cursor, limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined });
}

export function getNextCursor<T extends { id: string }>(items: T[], limit: number): string | null {
  if (items.length <= limit) return null;
  return items[limit]?.id ?? null;
}
