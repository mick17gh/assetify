"use client";

import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Trash2,
  UserCheck,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TimelineItem = {
  id: string;
  at: string;
  kind: string;
  title: string;
  detail: string;
};

const kindMeta: Record<string, { badge: string; icon: React.ComponentType<{ className?: string }> }> = {
  status: { badge: "bg-navy-100 text-navy-800", icon: RefreshCw },
  movement: { badge: "bg-sky-100 text-sky-800", icon: MapPin },
  acknowledgement: { badge: "bg-emerald-100 text-emerald-800", icon: UserCheck },
  maintenance: { badge: "bg-amber-100 text-amber-800", icon: Wrench },
  verification: { badge: "bg-indigo-100 text-indigo-800", icon: CheckCircle2 },
  exception: { badge: "bg-rose-100 text-rose-800", icon: ShieldAlert },
  disposal: { badge: "bg-zinc-200 text-zinc-800", icon: Trash2 },
  document: { badge: "bg-violet-100 text-violet-800", icon: FileText },
  replacement: { badge: "bg-orange-100 text-orange-800", icon: AlertTriangle },
};

export function AssetTimeline({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-navy-900/70">No lifecycle events yet.</p>;
  }

  return (
    <div className="relative pl-8">
      <span className="absolute top-1 bottom-1 left-3 w-px bg-navy-200" />
      <div className="space-y-4">
        {items.map((item, index) => {
          const meta = kindMeta[item.kind] ?? kindMeta.status;
          const Icon = meta.icon;
          return (
            <div key={item.id} className="relative">
              <span className="absolute top-4 -left-[1.35rem] h-3.5 w-3.5 rounded-full bg-navy-500 ring-4 ring-white" />
              <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-sm">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-semibold text-navy-950">
                    <Icon className="h-4 w-4 text-navy-700" />
                    <span>{item.title}</span>
                  </p>
                  <span className="text-xs font-medium text-navy-900/65">{item.at}</span>
                </div>
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className={cn("rounded-md px-2 py-1 font-medium capitalize", meta.badge)}>{item.kind}</span>
                  <span className="ml-auto text-navy-900/45">#{items.length - index}</span>
                </div>
                <p className="text-sm text-navy-900/70">{item.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
