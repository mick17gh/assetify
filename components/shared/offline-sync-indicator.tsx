"use client";

import { useEffect } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import { useOfflineQueue } from "@/hooks/use-offline-queue";

export function OfflineSyncIndicator() {
  const { queue, syncNow, syncing, isOfflineEnabled } = useOfflineQueue();
  const { state, isMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;

  useEffect(() => {
    void syncNow();
  }, [syncNow]);

  if (!isOfflineEnabled) return null;

  const statusLabel = queue.length ? `${queue.length} offline updates pending` : "Online sync healthy";
  const syncLabel = syncing ? "Syncing..." : "Sync";

  return (
    <div className="flex min-w-0 items-center gap-2 group-data-[collapsible=icon]:flex-col">
      <Badge variant={queue.length ? "destructive" : "secondary"} className="max-w-full truncate group-data-[collapsible=icon]:hidden">
        {statusLabel}
      </Badge>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="hidden size-8 items-center justify-center rounded-md border border-navy-200 group-data-[collapsible=icon]:inline-flex"
            aria-label={statusLabel}
          >
            <span className={`size-2 rounded-full ${queue.length ? "bg-red-500" : "bg-emerald-500"}`} />
          </span>
        </TooltipTrigger>
        <TooltipContent side="right">{statusLabel}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 cursor-pointer border-navy-200 px-2 text-xs group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:px-0"
            onClick={() => {
              void syncNow();
            }}
            disabled={queue.length === 0 || syncing}
            aria-label={syncLabel}
          >
            {syncing ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin group-data-[collapsible=icon]:mr-0 group-data-[collapsible=icon]:h-4 group-data-[collapsible=icon]:w-4" />
            ) : (
              <RefreshCw className="mr-1 hidden h-4 w-4 group-data-[collapsible=icon]:mr-0 group-data-[collapsible=icon]:inline" />
            )}
            <span className="group-data-[collapsible=icon]:sr-only">{syncLabel}</span>
          </Button>
        </TooltipTrigger>
        {collapsed ? <TooltipContent side="right">{syncLabel}</TooltipContent> : null}
      </Tooltip>
    </div>
  );
}
