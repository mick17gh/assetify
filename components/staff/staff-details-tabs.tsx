"use client";

import { CheckCircle2, Clock3, MapPin, Package, Wrench, XCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type AllocatedAsset = {
  id: string;
  ain: string;
  name: string;
  status: string;
  branch: string;
  location: string;
};

type MovementItem = {
  id: string;
  date: string;
  assetName: string;
  assetId: string;
  movementType: string;
  note: string;
};

type HistoryItem = {
  id: string;
  date: string;
  assetName: string;
  assetId: string;
  from: string;
  to: string;
  note: string;
};

const statusMeta: Record<string, { badge: string; icon: React.ComponentType<{ className?: string }> }> = {
  ACTIVE: { badge: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  UNDER_REPAIR: { badge: "bg-amber-100 text-amber-700", icon: Wrench },
  FAULTY: { badge: "bg-orange-100 text-orange-700", icon: XCircle },
  IN_STORAGE: { badge: "bg-blue-100 text-blue-700", icon: Package },
  MISSING: { badge: "bg-rose-100 text-rose-700", icon: XCircle },
  DISPOSED: { badge: "bg-zinc-100 text-zinc-700", icon: XCircle },
  "N/A": { badge: "bg-purple-100 text-purple-700", icon: Clock3 },
};

export function StaffDetailsTabs({
  allocatedAssets,
  movements,
  history,
}: {
  allocatedAssets: AllocatedAsset[];
  movements: MovementItem[];
  history: HistoryItem[];
}) {
  return (
    <Tabs defaultValue="assets" className="w-full">
      <TabsList className="mb-4 h-10 rounded-lg bg-purple-50">
        <TabsTrigger value="assets">Allocated Assets</TabsTrigger>
        <TabsTrigger value="movements">Movement History</TabsTrigger>
        <TabsTrigger value="history">Status History</TabsTrigger>
      </TabsList>

      <TabsContent value="assets">
        <Card className="border-purple-200 shadow-sm">
          <CardContent className="pt-6">
            {allocatedAssets.length === 0 ? (
              <p className="text-sm text-purple-900/70">No assets currently assigned to this staff member.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>AIN</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocatedAssets.map((asset) => {
                    const meta = statusMeta[asset.status] ?? statusMeta["N/A"];
                    return (
                      <TableRow key={asset.id}>
                        <TableCell>
                          <Link href={`/assets/${asset.id}`} className="font-medium text-[#6D28D9] hover:underline">
                            {asset.ain}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={`/assets/${asset.id}`} className="hover:underline">
                            {asset.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("hover:bg-inherit", meta.badge)}>{asset.status}</Badge>
                        </TableCell>
                        <TableCell>{asset.branch}</TableCell>
                        <TableCell>{asset.location}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="movements">
        <Card className="border-purple-200 shadow-sm">
          <CardContent className="space-y-3 pt-6">
            {movements.length === 0 ? (
              <p className="text-sm text-purple-900/70">No movement activity recorded for this staff member.</p>
            ) : (
              movements.map((item) => (
                <div key={item.id} className="rounded-lg border border-purple-100 bg-white p-3 text-sm">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="flex items-center gap-2 font-medium text-purple-950">
                      <MapPin className="h-4 w-4 text-purple-700" />
                      <Link href={`/assets/${item.assetId}`} className="hover:underline">
                        {item.assetName}
                      </Link>
                    </p>
                    <span className="text-xs text-purple-900/60">{item.date}</span>
                  </div>
                  <p className="text-purple-900/75">
                    {item.movementType}
                    {item.note ? ` — ${item.note}` : ""}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="history">
        <Card className="border-purple-200 shadow-sm">
          <CardContent className="space-y-3 pt-6">
            {history.length === 0 ? (
              <p className="text-sm text-purple-900/70">No status history for assets assigned to this staff member.</p>
            ) : (
              history.map((item) => (
                <div key={item.id} className="rounded-lg border border-purple-100 bg-white p-3 text-sm">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="font-medium text-purple-950">
                      <Link href={`/assets/${item.assetId}`} className="hover:underline">
                        {item.assetName}
                      </Link>
                    </p>
                    <span className="text-xs text-purple-900/60">{item.date}</span>
                  </div>
                  <p className="text-purple-900/75">
                    {item.from} → {item.to}
                    {item.note ? ` — ${item.note}` : ""}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
