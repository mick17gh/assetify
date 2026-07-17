"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { API_ROUTES } from "@/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type DepartmentRow = {
  departmentId: string | null;
  departmentName: string;
  branchName: string;
  assetCount: number;
  totalCost: number;
};

type DisposalSummaryRow = {
  method: string;
  count: number;
  totalPurchaseValue: number;
  totalSaleProceeds: number;
};

type ValuationRow = {
  assetId: string;
  assetName: string;
  ain: string;
  branchName: string;
  state: string;
  purchaseCost: number;
  currentValue: number;
  recommendedSalePrice: number;
};

export function ReportCenter({
  dueCount,
  dueCost,
  departmentRows,
  disposalSummary,
  valuationRows,
  canViewFinance,
}: {
  dueCount: number;
  dueCost: number;
  departmentRows: DepartmentRow[];
  disposalSummary: DisposalSummaryRow[];
  valuationRows: ValuationRow[];
  canViewFinance: boolean;
}) {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (report: string, format: "pdf" | "excel") => {
    const key = `${report}-${format}`;
    setExporting(key);
    try {
      const response = await fetch(`${API_ROUTES.EXPORT_REPORTS}?report=${report}&format=${format}`);
      if (!response.ok) return;
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${report}-report.${format === "excel" ? "xlsx" : "pdf"}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  };

  const ExportButtons = ({ report }: { report: string }) => (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        size="sm"
        disabled={exporting !== null}
        onClick={() => handleExport(report, "pdf")}
        className="cursor-pointer"
      >
            {exporting === `${report}-pdf` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {exporting === `${report}-pdf` ? "Exporting..." : "PDF"}
      </Button>
      <Button
        size="sm"
        disabled={exporting !== null}
        onClick={() => handleExport(report, "excel")}
        className="cursor-pointer bg-[#7C3AED] hover:bg-[#6D28D9]"
      >
        {exporting === `${report}-excel` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {exporting === `${report}-excel` ? "Exporting..." : "Excel"}
      </Button>
    </div>
  );

  return (
    <Card className="border-purple-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base text-purple-950">Report Center</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="replacement">
          <TabsList className="mb-4 flex flex-wrap">
            <TabsTrigger value="replacement">Replacement</TabsTrigger>
            {canViewFinance ? <TabsTrigger value="department">Department Cost</TabsTrigger> : null}
            {canViewFinance ? <TabsTrigger value="disposal">Disposal</TabsTrigger> : null}
            {canViewFinance ? <TabsTrigger value="valuation">End-of-Life FMV</TabsTrigger> : null}
          </TabsList>

          <TabsContent value="replacement" className="space-y-4">
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
            <ExportButtons report="replacement" />
          </TabsContent>

          {canViewFinance ? (
            <TabsContent value="department" className="space-y-4">
              <ExportButtons report="department-cost" />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Assets</TableHead>
                    <TableHead>Total Cost (GHS)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentRows.map((row) => (
                    <TableRow key={row.departmentId ?? "unassigned"}>
                      <TableCell>{row.departmentName}</TableCell>
                      <TableCell>{row.branchName}</TableCell>
                      <TableCell>{row.assetCount}</TableCell>
                      <TableCell>{row.totalCost.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          ) : null}

          {canViewFinance ? (
            <TabsContent value="disposal" className="space-y-4">
              <ExportButtons report="disposal-summary" />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Value Removed</TableHead>
                    <TableHead>Sale Proceeds</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disposalSummary.map((row) => (
                    <TableRow key={row.method}>
                      <TableCell>{row.method}</TableCell>
                      <TableCell>{row.count}</TableCell>
                      <TableCell>GHS {row.totalPurchaseValue.toLocaleString()}</TableCell>
                      <TableCell>GHS {row.totalSaleProceeds.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          ) : null}

          {canViewFinance ? (
            <TabsContent value="valuation" className="space-y-4">
              <ExportButtons report="end-of-life-valuation" />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Purchase</TableHead>
                    <TableHead>Current Value</TableHead>
                    <TableHead>Recommended Sale</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {valuationRows.map((row) => (
                    <TableRow key={row.assetId}>
                      <TableCell>{row.assetName}</TableCell>
                      <TableCell>{row.state}</TableCell>
                      <TableCell>GHS {row.purchaseCost.toLocaleString()}</TableCell>
                      <TableCell>GHS {row.currentValue.toLocaleString()}</TableCell>
                      <TableCell>GHS {row.recommendedSalePrice.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          ) : null}
        </Tabs>
      </CardContent>
    </Card>
  );
}
