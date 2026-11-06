"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { pageActionGroupClass } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export function CampaignExportButtons({ campaignId }: { campaignId: string }) {
  const [pending, setPending] = useState<"csv" | "pdf" | null>(null);

  async function download(format: "csv" | "pdf") {
    if (pending) return;
    setPending(format);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/export?format=${format}`);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const match = /filename="([^"]+)"/.exec(disposition);
      link.href = url;
      link.download = match?.[1] ?? `campaign-${campaignId}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className={pageActionGroupClass}>
      <Button
        type="button"
        variant="outline"
        className="cursor-pointer border-navy-200"
        disabled={pending !== null}
        aria-busy={pending === "csv"}
        onClick={() => download("csv")}
      >
        {pending === "csv" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {pending === "csv" ? "Downloading..." : "Download CSV"}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="cursor-pointer border-navy-200"
        disabled={pending !== null}
        aria-busy={pending === "pdf"}
        onClick={() => download("pdf")}
      >
        {pending === "pdf" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {pending === "pdf" ? "Downloading..." : "Download PDF"}
      </Button>
    </div>
  );
}
