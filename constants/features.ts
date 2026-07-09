export const FEATURE_FLAGS = {
  ENABLE_OFFLINE_MODE: true,
  ENABLE_PDF_EXPORT: true,
  ENABLE_EXCEL_EXPORT: true,
  ENABLE_WARRANTY_REMINDERS: true,
} as const;

export const SHOW_USAGE_MANUAL = process.env.SHOW_USAGE_MANUAL === "true";

export const ORG_FEATURE_KEYS = {
  QR_LOCATION_SCANNING: "qrLocationScanning",
} as const;
