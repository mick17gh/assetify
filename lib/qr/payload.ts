const CUID_PATTERN = /^c[a-z0-9]{24,}$/i;

export const QR_LOCATION_TYPES = {
  BRANCH: "branch",
  ROOM: "room",
  SHELF: "shelf",
} as const;

export type QrLocationType = (typeof QR_LOCATION_TYPES)[keyof typeof QR_LOCATION_TYPES];

type AssetScanPayload = { kind: "asset"; assetId: string };
type LocationScanPayload = { kind: "location"; locationType: QrLocationType; locationId: string };

export type QrScanPayload = AssetScanPayload | LocationScanPayload;

function isCuidLike(value: string): boolean {
  return CUID_PATTERN.test(value.trim());
}

function normalizeBaseUrl(baseUrl?: string): string | null {
  const raw = baseUrl?.trim();
  if (!raw) return null;
  const withProtocol = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/, "");
}

function parseLocationType(value: string | null): QrLocationType | null {
  if (!value) return null;
  if (value === QR_LOCATION_TYPES.BRANCH || value === QR_LOCATION_TYPES.ROOM || value === QR_LOCATION_TYPES.SHELF) return value;
  return null;
}

export function buildAssetQrUrl(assetId: string, baseUrl?: string): string {
  const root = normalizeBaseUrl(baseUrl ?? process.env.NEXT_PUBLIC_APP_URL);
  if (!isCuidLike(assetId)) return assetId;
  if (!root) return `/locations/scan?asset=${encodeURIComponent(assetId)}`;
  return `${root}/locations/scan?asset=${encodeURIComponent(assetId)}`;
}

export function buildLocationQrUrl(locationType: QrLocationType, locationId: string, baseUrl?: string): string {
  const root = normalizeBaseUrl(baseUrl ?? process.env.NEXT_PUBLIC_APP_URL);
  if (!isCuidLike(locationId)) return locationId;
  const query = `locationType=${encodeURIComponent(locationType)}&locationId=${encodeURIComponent(locationId)}`;
  if (!root) return `/locations/scan?${query}`;
  return `${root}/locations/scan?${query}`;
}

export function parseQrScanValue(value: string): QrScanPayload | null {
  const raw = value.trim();
  if (!raw) return null;

  if (isCuidLike(raw)) return { kind: "asset", assetId: raw };

  if (raw.startsWith("assetify://asset/")) {
    const assetId = raw.replace("assetify://asset/", "").trim();
    return isCuidLike(assetId) ? { kind: "asset", assetId } : null;
  }

  try {
    const parsed = new URL(raw);
    const assetId = parsed.searchParams.get("asset");
    if (assetId && isCuidLike(assetId)) return { kind: "asset", assetId };

    const locationType = parseLocationType(parsed.searchParams.get("locationType"));
    const locationId = parsed.searchParams.get("locationId");
    if (locationType && locationId && isCuidLike(locationId)) {
      return { kind: "location", locationType, locationId };
    }
  } catch {
    return null;
  }

  return null;
}
