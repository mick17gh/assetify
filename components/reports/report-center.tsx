"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportExportButtons } from "@/components/reports/report-export-buttons";

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
            <p className="text-sm text-purple-900/65">
              Use PDF / Excel next to the table below. Exports respect the current state and search filters.
            </p>
          </TabsContent>

          {canViewFinance ? (
            <TabsContent value="department" className="space-y-4">
              <div className="flex justify-end">
                <ReportExportButtons report="department-cost" />
              </div>
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
              <div className="flex justify-end">
                <ReportExportButtons report="disposal-summary" />
              </div>
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
              <div className="flex justify-end">
                <ReportExportButtons report="end-of-life-valuation" />
              </div>
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
