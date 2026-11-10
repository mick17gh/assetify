"use client";

import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  Wrench,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ENUM_LABELS } from "@/constants";
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
  PENDING_ONBOARDING: { badge: "bg-sky-100 text-sky-700", icon: Clock3 },
  PENDING_DISPOSAL: { badge: "bg-violet-100 text-violet-700", icon: Clock3 },
  "N/A": { badge: "bg-navy-100 text-navy-700", icon: Clock3 },
};

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-navy-200 bg-navy-50/40 px-6 py-12 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-navy-100">
        <Package className="h-4 w-4 text-navy-700" />
      </div>
      <p className="text-sm font-medium text-navy-950">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-navy-900/60">{description}</p>
    </div>
  );
}

function TabCount({ count }: { count: number }) {
  return (
    <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-navy-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-navy-800">
      {count}
    </span>
  );
}

function statusLabel(status: string) {
  return ENUM_LABELS.assetStatus[status] ?? status;
}

function movementLabel(type: string) {
  return ENUM_LABELS.movementType[type] ?? type;
}

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
      <TabsList className="mb-4 h-auto flex-wrap rounded-lg bg-navy-50">
        <TabsTrigger value="assets" className="cursor-pointer">
          Allocated Assets
          <TabCount count={allocatedAssets.length} />
        </TabsTrigger>
        <TabsTrigger value="movements" className="cursor-pointer">
          Movements
          <TabCount count={movements.length} />
        </TabsTrigger>
        <TabsTrigger value="history" className="cursor-pointer">
          Status History
          <TabCount count={history.length} />
        </TabsTrigger>
      </TabsList>

      <TabsContent value="assets">
        <Card className="border-navy-200 shadow-sm">
          <CardContent className="pt-6">
            {allocatedAssets.length === 0 ? (
              <EmptyState
                title="No assets in custody"
                description="This staff member does not currently hold any assigned assets in your scope."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {allocatedAssets.map((asset) => {
                  const meta = statusMeta[asset.status] ?? statusMeta["N/A"];
                  const StatusIcon = meta.icon;
                  return (
                    <Link
                      key={asset.id}
                      href={`/assets/${asset.id}`}
                      prefetch
                      className="group cursor-pointer rounded-xl border border-navy-100 bg-white p-4 transition-all duration-200 hover:border-navy-300 hover:shadow-sm"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-navy-950 group-hover:underline">
                            {asset.name}
                          </p>
                          <p className="mt-0.5 font-mono text-xs text-navy-900/55">{asset.ain}</p>
                        </div>
                        <Badge className={cn("shrink-0 hover:bg-inherit", meta.badge)}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusLabel(asset.status)}
                        </Badge>
                      </div>
                      <div className="space-y-1.5 text-xs text-navy-900/65">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-navy-700/70" />
                          <span className="truncate">{asset.location}</span>
                        </p>
                        <p className="truncate pl-5">{asset.branch}</p>
                      </div>
                      <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-navy-800 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        Open asset
                        <ArrowRight className="h-3 w-3" />
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="movements">
        <Card className="border-navy-200 shadow-sm">
          <CardContent className="pt-6">
            {movements.length === 0 ? (
              <EmptyState
                title="No movement activity"
                description="Transfers and assignments involving this staff member will appear here."
              />
            ) : (
              <ol className="relative space-y-0 border-l border-navy-100 pl-5">
                {movements.map((item, index) => (
                  <li key={item.id} className="relative pb-5 last:pb-0">
                    <span
                      className={cn(
                        "absolute -left-[1.4rem] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white",
                        index === 0 ? "bg-navy-700" : "bg-navy-300",
                      )}
                    />
                    <div className="rounded-xl border border-navy-100 bg-white p-3.5 text-sm transition-colors duration-200 hover:border-navy-200">
                      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                        <Link
                          href={`/assets/${item.assetId}`}
                          prefetch
                          className="cursor-pointer font-medium text-navy-950 hover:underline"
                        >
                          {item.assetName}
                        </Link>
                        <span className="text-xs text-navy-900/55">{item.date}</span>
                      </div>
                      <Badge variant="secondary" className="mb-1.5">
                        {movementLabel(item.movementType)}
                      </Badge>
                      {item.note ? <p className="text-navy-900/70">{item.note}</p> : null}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="history">
        <Card className="border-navy-200 shadow-sm">
          <CardContent className="pt-6">
            {history.length === 0 ? (
              <EmptyState
                title="No status history"
                description="Status changes on currently assigned assets will show up in this timeline."
              />
            ) : (
              <ol className="relative space-y-0 border-l border-navy-100 pl-5">
                {history.map((item, index) => (
                  <li key={item.id} className="relative pb-5 last:pb-0">
                    <span
                      className={cn(
                        "absolute -left-[1.4rem] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white",
                        index === 0 ? "bg-navy-700" : "bg-navy-300",
                      )}
                    />
                    <div className="rounded-xl border border-navy-100 bg-white p-3.5 text-sm transition-colors duration-200 hover:border-navy-200">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <Link
                          href={`/assets/${item.assetId}`}
                          prefetch
                          className="cursor-pointer font-medium text-navy-950 hover:underline"
                        >
                          {item.assetName}
                        </Link>
                        <span className="text-xs text-navy-900/55">{item.date}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge className="bg-navy-100 text-navy-700 hover:bg-navy-100">
                          {statusLabel(item.from)}
                        </Badge>
                        <ArrowRight className="h-3.5 w-3.5 text-navy-500" />
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          {statusLabel(item.to)}
                        </Badge>
                      </div>
                      {item.note ? <p className="mt-2 text-navy-900/70">{item.note}</p> : null}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
