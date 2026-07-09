"use client";

import { useCallback, useState } from "react";
import { API_ROUTES, FEATURE_FLAGS } from "@/constants";

const STORAGE_KEY = "assetify-offline-queue";

export type OfflineOperation = {
  type: string;
  payload: Record<string, unknown>;
};

function readQueueStorage(): OfflineOperation[] {
  if (typeof window === "undefined") return [];
  const current = localStorage.getItem(STORAGE_KEY);
  return current ? (JSON.parse(current) as OfflineOperation[]) : [];
}

function writeQueueStorage(queue: OfflineOperation[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function enqueueOfflineOperation(operation: OfflineOperation) {
  const next = [...readQueueStorage(), operation];
  writeQueueStorage(next);
  return next;
}

export function useOfflineQueue() {
  const [queue, setQueue] = useState<OfflineOperation[]>(() => readQueueStorage());
  const [syncing, setSyncing] = useState(false);

  const enqueue = useCallback((operation: OfflineOperation) => {
    setQueue((prev) => {
      const next = [...prev, operation];
      writeQueueStorage(next);
      return next;
    });
  }, []);

  const syncNow = useCallback(async () => {
    if (!FEATURE_FLAGS.ENABLE_OFFLINE_MODE || queue.length === 0 || !navigator.onLine) {
      return false;
    }
    setSyncing(true);

    try {
      const response = await fetch(API_ROUTES.OFFLINE_SYNC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operations: queue }),
      });

      if (!response.ok) return false;
      localStorage.removeItem(STORAGE_KEY);
      setQueue([]);
      return true;
    } finally {
      setSyncing(false);
    }
  }, [queue]);

  return {
    queue,
    enqueue,
    syncNow,
    syncing,
    isOfflineEnabled: FEATURE_FLAGS.ENABLE_OFFLINE_MODE,
  };
}
