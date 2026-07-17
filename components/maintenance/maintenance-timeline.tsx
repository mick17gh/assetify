"use client";

import { MaintenanceDocumentUpload } from "@/components/maintenance/maintenance-document-upload";
import { Badge } from "@/components/ui/badge";
import { ENUM_LABELS } from "@/constants/labels";

type MaintenanceTimelineItem = {
  id: string;
  serviceDate: string;
  description: string;
  cost: string;
  vendorName: string;
  status: string;
  documents: Array<{ id: string; fileName: string; fileUrl: string }>;
};

export function MaintenanceTimeline({
  items,
  totalCost,
  purchaseCost,
  isHighCost,
}: {
  items: MaintenanceTimelineItem[];
  totalCost: number;
  purchaseCost: number;
  isHighCost: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>
          Total maintenance: <strong>GHS {totalCost.toLocaleString()}</strong> of purchase GHS {purchaseCost.toLocaleString()}
        </span>
        {isHighCost ? (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">High maintenance cost — review for replacement</Badge>
        ) : null}
      </div>
      <div className="relative space-y-4 border-l-2 border-purple-200 pl-4">
        {items.length === 0 ? (
          <p className="text-sm text-purple-900/60">No maintenance records yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="relative">
              <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-[#7C3AED]" />
              <div className="rounded-lg border border-purple-100 bg-white p-3">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-purple-950">{item.serviceDate}</span>
                  <Badge variant="secondary">{ENUM_LABELS.maintenanceStatus[item.status] ?? item.status}</Badge>
                  {item.cost !== "N/A" ? <span className="text-sm text-purple-900/70">GHS {item.cost}</span> : null}
                  <MaintenanceDocumentUpload recordId={item.id} />
                </div>
                <p className="text-sm text-purple-900/80">{item.description}</p>
                {item.vendorName ? <p className="mt-1 text-xs text-purple-900/60">Vendor: {item.vendorName}</p> : null}
                {item.documents.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-xs">
                    {item.documents.map((doc) => (
                      <li key={doc.id}>
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-[#6D28D9] hover:underline">
                          {doc.fileName}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
