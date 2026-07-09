export const REGEX = {
  AIN: /^AIN-[A-Z0-9-]{6,24}$/,
  SERIAL: /^[A-Z0-9-]{4,50}$/i,
  CURRENCY: /^\d+(\.\d{1,2})?$/,
} as const;
