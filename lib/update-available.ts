"use client";

import { toast } from "sonner";

export const UPDATE_TOAST_ID = "app-update-available";

export function isStaleClientError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("failed to find server action") ||
    message.includes("server action not found") ||
    message.includes("failed to find serveraction") ||
    message.includes("the client and server don't match") ||
    (message.includes("unexpected token") && message.includes("html"))
  );
}

export function notifyUpdateAvailable(reason?: string) {
  toast.info("Update available", {
    id: UPDATE_TOAST_ID,
    description: reason ?? "A new version of Assetify is ready. Refresh to continue.",
    duration: Infinity,
    action: {
      label: "Refresh",
      onClick: () => {
        window.location.reload();
      },
    },
  });
}
