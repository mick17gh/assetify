export type SearchParams = Record<string, string | string[] | undefined>;
type QueryParamsLike = { toString(): string };

export function getQueryString(searchParams: SearchParams, key: string): string {
  const value = searchParams[key];
  if (!value) return "";
  return Array.isArray(value) ? (value[0] ?? "") : value;
}

export function getOptionalQuery(searchParams: SearchParams, key: string): string | undefined {
  const value = getQueryString(searchParams, key).trim();
  return value.length > 0 ? value : undefined;
}

export function getQueryNavigationTarget(
  currentParams: QueryParamsLike,
  mutate: (next: URLSearchParams) => void,
): string | null {
  const currentQuery = currentParams.toString();
  const nextParams = new URLSearchParams(currentQuery);
  mutate(nextParams);
  const nextQuery = nextParams.toString();
  if (nextQuery === currentQuery) return null;
  return nextQuery ? `?${nextQuery}` : "?";
}
