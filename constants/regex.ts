export const REGEX = {
  AIN: /^[A-Z0-9-]{4,32}$/i,
  SERIAL: /^[A-Z0-9-]{4,50}$/i,
  CURRENCY: /^\d+(\.\d{1,2})?$/,
} as const;
