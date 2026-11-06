"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { API_ROUTES } from "@/constants";
import { Button } from "@/components/ui/button";

export function ReportExportButtons({
  report = "replacement",
}: {
  report?: "replacement" | "department-cost" | "disposal-summary" | "end-of-life-valuation";
}) {
  const params = useSearchParams();
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  const handleExport = async (format: "pdf" | "excel") => {
    setExporting(format);
    try {
      const query = new URLSearchParams();
      query.set("report", report);
      query.set("format", format);
      const state = params.get("state");
      const q = params.get("q");
      if (state) query.set("state", state);
      if (q) query.set("q", q);

      const response = await fetch(`${API_ROUTES.EXPORT_REPORTS}?${query.toString()}`);
      if (!response.ok) return;
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      const stateSuffix = state ? `-${state.toLowerCase()}` : "";
      anchor.download = `${report}${stateSuffix}-report.${format === "excel" ? "xlsx" : "pdf"}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
      <Button
        variant="secondary"
        size="sm"
        disabled={exporting !== null}
        onClick={() => handleExport("pdf")}
        className="h-10 w-full cursor-pointer sm:h-9 sm:w-auto"
      >
        {exporting === "pdf" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {exporting === "pdf" ? "Exporting..." : "PDF"}
      </Button>
      <Button
        size="sm"
        disabled={exporting !== null}
        onClick={() => handleExport("excel")}
        className="h-10 w-full cursor-pointer bg-navy-900 hover:bg-navy-950 sm:h-9 sm:w-auto"
      >
        {exporting === "excel" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {exporting === "excel" ? "Exporting..." : "Excel"}
      </Button>
    </div>
  );
}
