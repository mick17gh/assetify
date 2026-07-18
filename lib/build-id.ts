/**
 * Stable id for the currently running deployment.
 * Set at build time via next.config (commit SHA / BUILD_ID / timestamp).
 */
export function getBuildId(): string {
  return process.env.BUILD_ID || `dev-${process.env.NODE_ENV ?? "development"}`;
}
