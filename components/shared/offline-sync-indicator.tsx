"use client";

import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOfflineQueue } from "@/hooks/use-offline-queue";

export function OfflineSyncIndicator() {
  const { queue, syncNow, syncing, isOfflineEnabled } = useOfflineQueue();

  useEffect(() => {
    void syncNow();
  }, [syncNow]);

  if (!isOfflineEnabled) return null;

  return (
    <div className="flex items-center gap-2">
      <Badge variant={queue.length ? "destructive" : "secondary"}>
        {queue.length ? `${queue.length} offline updates pending` : "Online sync healthy"}
      </Badge>
      <Button
        variant="outline"
        size="sm"
        className="h-7 cursor-pointer border-purple-200 px-2 text-xs"
        onClick={() => {
          void syncNow();
        }}
        disabled={queue.length === 0 || syncing}
      >
        {syncing ? "Syncing..." : "Sync"}
      </Button>
    </div>
  );
}
