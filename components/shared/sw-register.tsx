"use client";

import { useEffect } from "react";
import { FEATURE_FLAGS } from "@/constants";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!FEATURE_FLAGS.ENABLE_OFFLINE_MODE || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Silent by design, app still works online.
    });
  }, []);

  return null;
}
