"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { API_ROUTES } from "@/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ReportCenter({
  dueCount,
  dueCost,
}: {
  dueCount: number;
  dueCost: number;
}) {
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  const handleExport = async (format: "pdf" | "excel") => {
    setExporting(format);
    try {
      const response = await fetch(`${API_ROUTES.EXPORT_REPORTS}?format=${format}`);
      if (!response.ok) return;
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `replacement-report.${format === "excel" ? "xlsx" : "pdf"}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  };

  return (
    <Card className="border-purple-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base text-purple-950">Branch and Management Reports</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-purple-100 bg-purple-50/80 p-3.5">
            <p className="text-xl font-semibold text-[#7C3AED]">{dueCount}</p>
            <p className="text-purple-900/70">Assets due for replacement</p>
          </div>
          <div className="rounded-lg border border-purple-100 bg-purple-50/80 p-3.5">
            <p className="text-xl font-semibold text-[#7C3AED]">
              GHS {dueCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-purple-900/70">Estimated replacement cost</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            disabled={exporting !== null}
            onClick={() => handleExport("pdf")}
            className="cursor-pointer border-purple-200 bg-white hover:bg-purple-50"
          >
            {exporting === "pdf" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {exporting === "pdf" ? "Exporting PDF..." : "Export PDF"}
          </Button>
          <Button
            disabled={exporting !== null}
            onClick={() => handleExport("excel")}
            className="cursor-pointer bg-[#7C3AED] hover:bg-[#6D28D9]"
          >
            {exporting === "excel" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {exporting === "excel" ? "Exporting Excel..." : "Export Excel"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
