"use client";

import { useEffect, useRef } from "react";
import { API_ROUTES } from "@/constants";
import { notifyUpdateAvailable } from "@/lib/update-available";

const POLL_MS = 2 * 60 * 1000;

async function fetchBuildId(): Promise<string | null> {
  try {
    const response = await fetch(API_ROUTES.VERSION, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { buildId?: string };
    return typeof data.buildId === "string" && data.buildId.length > 0 ? data.buildId : null;
  } catch {
    return null;
  }
}

export function UpdateAvailableWatcher() {
  const initialBuildId = useRef<string | null>(null);
  const notified = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const check = async () => {
      if (cancelled || notified.current || document.hidden) return;
      const buildId = await fetchBuildId();
      if (!buildId || cancelled) return;

      if (!initialBuildId.current) {
        initialBuildId.current = buildId;
        return;
      }

      if (buildId !== initialBuildId.current) {
        notified.current = true;
        notifyUpdateAvailable();
        if (intervalId) clearInterval(intervalId);
      }
    };

    void check();
    intervalId = setInterval(() => {
      void check();
    }, POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
