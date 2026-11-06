export const FEATURE_FLAGS = {
  ENABLE_OFFLINE_MODE: true,
  ENABLE_PDF_EXPORT: true,
  ENABLE_EXCEL_EXPORT: true,
  ENABLE_WARRANTY_REMINDERS: true,
} as const;

export const SHOW_USAGE_MANUAL = process.env.SHOW_USAGE_MANUAL === "true";

/** When true, `/` skips the marketing page and opens the app. */
export const HIDE_LANDING_PAGE = process.env.NEXT_PUBLIC_HIDE_LANDING_PAGE === "true";

export const ORG_FEATURE_KEYS = {
  QR_LOCATION_SCANNING: "qrLocationScanning",
} as const;
