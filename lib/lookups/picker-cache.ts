import type { PickerOption } from "@/lib/lookups/types";

const TTL_MS = 60_000;

type CacheEntry = { at: number; options: PickerOption[] };

const caches = new Map<string, Map<string, CacheEntry>>();
const inflight = new Map<string, Promise<PickerOption[]>>();

function bucket(namespace: string) {
  let map = caches.get(namespace);
  if (!map) {
    map = new Map();
    caches.set(namespace, map);
  }
  return map;
}

function cacheKey(namespace: string, query: string) {
  return `${namespace}::${query.trim().toLowerCase()}`;
}

export function peekPicker(namespace: string, query: string): PickerOption[] | null {
  const hit = bucket(namespace).get(query.trim().toLowerCase());
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    bucket(namespace).delete(query.trim().toLowerCase());
    return null;
  }
  return hit.options;
}

export function seedPicker(namespace: string, query: string, options: PickerOption[]) {
  bucket(namespace).set(query.trim().toLowerCase(), { at: Date.now(), options });
}

export async function fetchPickerCached(
  namespace: string,
  query: string,
  searchFn: (q: string) => Promise<PickerOption[]>,
): Promise<PickerOption[]> {
  const key = cacheKey(namespace, query);
  const cached = peekPicker(namespace, query);
  if (cached) return cached;

  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = searchFn(query)
    .then((options) => {
      seedPicker(namespace, query, options);
      return options;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}
