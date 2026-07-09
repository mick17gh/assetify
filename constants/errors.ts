export const ERROR_MESSAGES = {
  UNAUTHORIZED: "You are not authorized to perform this action.",
  FORBIDDEN: "You do not have enough permission for this resource.",
  INVALID_INPUT: "Input validation failed.",
  NOT_FOUND: "Requested resource was not found.",
  RATE_LIMITED: "Too many requests. Try again later.",
  OFFLINE_SYNC_CONFLICT: "Offline sync conflict detected. Resolve and retry.",
} as const;
