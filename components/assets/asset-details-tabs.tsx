"use client";

import { DocumentOpenButton } from "@/components/documents/document-open-button";
import { CheckCircle2, Clock3, FileText, MapPin, User, Wrench, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MaintenanceItem = {
  id: string;
  serviceDate: string;
  description: string;
  cost: string;
};

type HistoryItem = {
  id: string;
  date: string;
  from: string;
  to: string;
  note: string;
};

type FileItem = {
  id: string;
  fileName: string;
  type: string;
  fileUrl: string;
  createdAt: string;
};

type OverviewData = {
  status: string;
  condition: string;
  serialNumber: string;
  category: string;
  branch: string;
  department: string;
  room: string;
  shelf: string;
  custodian: string;
  vendor: string;
  purchaseDate: string;
  purchaseCost: string;
  warrantyExpiry: string;
  maintenanceCount: number;
  documentCount: number;
  latestMaintenance: { date: string; description: string } | null;
  latestHistory: { date: string; from: string; to: string } | null;
};

export function AssetDetailsTabs({
  overview,
  maintenance,
  history,
  files,
}: {
  overview: OverviewData;
  maintenance: MaintenanceItem[];
  history: HistoryItem[];
  files: FileItem[];
}) {
  const statusMeta: Record<string, { badge: string; dot: string; icon: React.ComponentType<{ className?: string }> }> = {
    ACTIVE: {
      badge: "bg-emerald-100 text-emerald-700",
      dot: "bg-emerald-500",
      icon: CheckCircle2,
    },
    UNDER_REPAIR: {
      badge: "bg-amber-100 text-amber-700",
      dot: "bg-amber-500",
      icon: Wrench,
    },
    FAULTY: {
      badge: "bg-orange-100 text-orange-700",
      dot: "bg-orange-500",
      icon: XCircle,
    },
    IN_STORAGE: {
      badge: "bg-blue-100 text-blue-700",
      dot: "bg-blue-500",
      icon: Clock3,
    },
    MISSING: {
      badge: "bg-rose-100 text-rose-700",
      dot: "bg-rose-500",
      icon: XCircle,
    },
    DISPOSED: {
      badge: "bg-zinc-100 text-zinc-700",
      dot: "bg-zinc-500",
      icon: XCircle,
    },
    "N/A": {
      badge: "bg-purple-100 text-purple-700",
      dot: "bg-purple-500",
      icon: Clock3,
    },
  };

  const getStatusMeta = (status: string) => statusMeta[status] ?? statusMeta["N/A"];

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="mb-4 h-10 rounded-lg bg-purple-50">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
        <TabsTrigger value="files">Files</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <Card className="border-purple-200 shadow-sm">
          <CardContent className="space-y-5 pt-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <OverviewField label="Status" value={overview.status} />
              <OverviewField label="Condition" value={overview.condition} />
              <OverviewField label="Serial" value={overview.serialNumber} />
              <OverviewField label="Category" value={overview.category} />
              <OverviewField label="Branch" value={overview.branch} />
              <OverviewField label="Department" value={overview.department} />
              <OverviewField label="Room" value={overview.room} />
              <OverviewField label="Shelf" value={overview.shelf} />
              <OverviewField label="Vendor" value={overview.vendor} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-purple-950">
                  <MapPin className="h-4 w-4 text-purple-700" />
                  Location & ownership
                </p>
                <div className="space-y-2 text-sm text-purple-900/75">
                  <p>
                    <span className="font-medium text-purple-950">Location:</span> {overview.room} / {overview.shelf}
                  </p>
                  <p className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-purple-700" />
                    <span>
                      <span className="font-medium text-purple-950">Custodian:</span> {overview.custodian}
                    </span>
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-4">
                <p className="mb-2 text-sm font-semibold text-purple-950">Financial snapshot</p>
                <div className="space-y-2 text-sm text-purple-900/75">
                  <p>
                    <span className="font-medium text-purple-950">Purchase date:</span> {overview.purchaseDate}
                  </p>
                  <p>
                    <span className="font-medium text-purple-950">Purchase cost:</span> {overview.purchaseCost}
                  </p>
                  <p>
                    <span className="font-medium text-purple-950">Warranty expiry:</span> {overview.warrantyExpiry}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <OverviewStat label="Maintenance records" value={String(overview.maintenanceCount)} />
              <OverviewStat label="Attached files" value={String(overview.documentCount)} />
              <OverviewStat label="Status changes" value={String(history.length)} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-purple-100 bg-white p-3 text-sm">
                <p className="mb-1 font-medium text-purple-950">Latest maintenance</p>
                {overview.latestMaintenance ? (
                  <p className="text-purple-900/75">
                    {overview.latestMaintenance.date} — {overview.latestMaintenance.description}
                  </p>
                ) : (
                  <p className="text-purple-900/60">No maintenance logged yet.</p>
                )}
              </div>
              <div className="rounded-lg border border-purple-100 bg-white p-3 text-sm">
                <p className="mb-1 font-medium text-purple-950">Latest status change</p>
                {overview.latestHistory ? (
                  <p className="text-purple-900/75">
                    {overview.latestHistory.date}: {overview.latestHistory.from} → {overview.latestHistory.to}
                  </p>
                ) : (
                  <p className="text-purple-900/60">No lifecycle history yet.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="maintenance">
        <Card className="border-purple-200 shadow-sm">
          <CardContent className="space-y-3 pt-6">
            {maintenance.length === 0 ? (
              <p className="text-sm text-purple-900/70">No maintenance records yet.</p>
            ) : (
              maintenance.map((item) => (
                <div key={item.id} className="rounded-lg border border-purple-100 bg-purple-50/60 p-3 text-sm">
                  <p className="flex items-center gap-2 font-medium text-purple-950">
                    <Wrench className="h-4 w-4 text-purple-700" />
                    <span>{item.description}</span>
                  </p>
                  <p className="text-purple-900/70">
                    {item.serviceDate} • Cost: {item.cost}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="history">
        <Card className="border-purple-200 shadow-sm">
          <CardContent className="pt-6">
            {history.length === 0 ? (
              <p className="text-sm text-purple-900/70">No status history yet.</p>
            ) : (
              <div className="relative pl-8">
                <span className="absolute top-1 bottom-1 left-3 w-px bg-purple-200" />
                <div className="space-y-4">
                  {history.map((item, index) => {
                    const fromMeta = getStatusMeta(item.from);
                    const toMeta = getStatusMeta(item.to);
                    const ToIcon = toMeta.icon;

                    return (
                      <div key={item.id} className="relative">
                        <span
                          className={cn(
                            "absolute top-4 -left-[1.35rem] h-3.5 w-3.5 rounded-full ring-4 ring-white",
                            toMeta.dot,
                          )}
                        />
                        <div className="rounded-xl border border-purple-100 bg-white p-4 shadow-sm">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="flex items-center gap-2 text-sm font-semibold text-purple-950">
                              <ToIcon className="h-4 w-4 text-purple-700" />
                              <span>Lifecycle update</span>
                            </p>
                            <span className="text-xs font-medium text-purple-900/65">{item.date}</span>
                          </div>
                          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                            <span className={cn("rounded-md px-2 py-1 font-medium", fromMeta.badge)}>
                              {item.from}
                            </span>
                            <span className="text-purple-900/60">to</span>
                            <span className={cn("rounded-md px-2 py-1 font-medium", toMeta.badge)}>
                              {item.to}
                            </span>
                            <span className="ml-auto text-purple-900/45">#{history.length - index}</span>
                          </div>
                          <p className="text-sm text-purple-900/70">{item.note || "No note provided."}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="files">
        <Card className="border-purple-200 shadow-sm">
          <CardContent className="space-y-3 pt-6">
            {files.length === 0 ? (
              <p className="text-sm text-purple-900/70">No files attached yet.</p>
            ) : (
              files.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-purple-100 bg-white p-3 text-sm"
                >
                  <div>
                    <p className="flex items-center gap-2 font-medium text-purple-950">
                      <FileText className="h-4 w-4 text-purple-700" />
                      <span>{item.fileName}</span>
                    </p>
                    <p className="text-purple-900/70">
                      {item.type} • {item.createdAt}
                    </p>
                  </div>
                  <DocumentOpenButton fileUrl={item.fileUrl} fileName={item.fileName} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function OverviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-purple-100 bg-white p-3 text-sm">
      <p className="text-xs text-purple-900/60">{label}</p>
      <p className="font-medium text-purple-950">{value}</p>
    </div>
  );
}

function OverviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-3 text-center">
      <p className="text-xl font-semibold text-[#7C3AED]">{value}</p>
      <p className="text-xs text-purple-900/70">{label}</p>
    </div>
  );
}
