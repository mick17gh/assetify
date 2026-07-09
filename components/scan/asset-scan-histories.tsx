"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import type { MovementHistoryItem, StatusHistoryItem } from "@/lib/qr/asset-scan-profile";

export function AssetScanHistories({
  movements,
  statusHistory,
}: {
  movements: MovementHistoryItem[];
  statusHistory: StatusHistoryItem[];
}) {
  return (
    <Tabs defaultValue="movements" className="w-full">
      <TabsList className="mb-4 h-10 rounded-lg bg-purple-50">
        <TabsTrigger value="movements">Movement history</TabsTrigger>
        <TabsTrigger value="status">Status history</TabsTrigger>
      </TabsList>

      <TabsContent value="movements">
        <Card className="border-purple-200 shadow-sm">
          <CardContent className="space-y-3 pt-6">
            {movements.length === 0 ? (
              <p className="text-sm text-purple-900/70">No movement records yet.</p>
            ) : (
              movements.map((item) => (
                <div key={item.id} className="rounded-lg border border-purple-100 bg-white p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-purple-950">{item.movementType}</p>
                    <p className="text-xs text-purple-900/60">{item.date}</p>
                  </div>
                  <p className="mt-1 text-purple-900/75">
                    {item.from} → {item.to}
                  </p>
                  {item.note ? <p className="mt-1 text-xs text-purple-900/60">{item.note}</p> : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="status">
        <Card className="border-purple-200 shadow-sm">
          <CardContent className="space-y-3 pt-6">
            {statusHistory.length === 0 ? (
              <p className="text-sm text-purple-900/70">No status changes recorded yet.</p>
            ) : (
              statusHistory.map((item) => (
                <div key={item.id} className="rounded-lg border border-purple-100 bg-white p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-purple-950">
                      {item.from} → {item.to}
                    </p>
                    <p className="text-xs text-purple-900/60">{item.date}</p>
                  </div>
                  {item.note ? <p className="mt-1 text-xs text-purple-900/60">{item.note}</p> : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
