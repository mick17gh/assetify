"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { generateReportAction } from "@/app/(dashboard)/reports/actions";
import { REPORT_CATALOG, type ReportCatalogEntry } from "@/lib/reports/catalog";
import { canExportReports } from "@/lib/reports/permissions";
import { buildCsvFromPayload, buildWorkbookFromPayload, reportFilename } from "@/lib/reports/payload-export";
import type { ReportDataPayload, ReportId } from "@/lib/reports/types";
import { humanizeKey } from "@/lib/reports/formatters";
import type { PickerOption } from "@/lib/lookups/types";
import { ASSET_CONDITION, ASSET_STATUS, ENUM_LABELS } from "@/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AssetLookupPicker } from "@/components/shared/entity-lookups";
import { InlineCombobox, type ReferenceOption } from "@/components/shared/reference-selects";
import { ReportPreviewTable } from "@/components/reports/report-preview-table";

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 1);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function payloadTables(payload: ReportDataPayload) {
  const tables: Array<{ title: string; rows: Record<string, unknown>[] }> = [];
  if (payload.summary) {
    tables.push({
      title: "Summary",
      rows: Object.entries(payload.summary).map(([Metric, Value]) => ({ Metric, Value })),
    });
  }
  for (const [key, value] of Object.entries(payload)) {
    if (
      [
        "reportId",
        "reportName",
        "period",
        "scopeName",
        "generatedAt",
        "primaryDataKey",
        "primarySheetName",
        "summary",
      ].includes(key)
    ) {
      continue;
    }
    if (!Array.isArray(value)) continue;
    tables.push({ title: humanizeKey(key), rows: value as Record<string, unknown>[] });
  }
  return tables;
}

export function ReportsCenter({
  accessibleIds,
  canExport,
  branches,
  departments,
  categories,
  assetSeed,
}: {
  accessibleIds: ReportId[];
  canExport: boolean;
  branches: ReferenceOption[];
  departments: ReferenceOption[];
  categories: ReferenceOption[];
  assetSeed: PickerOption[];
}) {
  const initial = defaultRange();
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);
  const [scopeId, setScopeId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [status, setStatus] = useState("");
  const [condition, setCondition] = useState("");
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<ReportDataPayload | null>(null);

  const statusOptions = useMemo(
    () => Object.values(ASSET_STATUS).map((id) => ({ id, label: ENUM_LABELS.assetStatus[id] ?? id })),
    [],
  );
  const conditionOptions = useMemo(
    () => Object.values(ASSET_CONDITION).map((id) => ({ id, label: ENUM_LABELS.assetCondition[id] ?? id })),
    [],
  );

  const catalog = useMemo(
    () => REPORT_CATALOG.filter((entry) => accessibleIds.includes(entry.id)),
    [accessibleIds],
  );

  function run(entry: ReportCatalogEntry, mode: "preview" | "csv" | "xlsx") {
    startTransition(async () => {
      try {
        if (mode !== "preview" && !canExport) {
          toast.error("You do not have export permission.");
          return;
        }
        const result = await generateReportAction({
          reportId: entry.id,
          startDate,
          endDate,
          scopeId: scopeId || undefined,
          departmentId: departmentId || undefined,
          categoryId: categoryId || undefined,
          assetId: assetId || undefined,
          status: status || undefined,
          condition: condition || undefined,
          search: search.trim() || undefined,
        });
        if (!result.success || !result.data) {
          toast.error(result.error ?? "Report generation failed.");
          return;
        }
        if (mode === "preview") {
          setPreview(result.data);
          return;
        }
        if (mode === "csv") {
          const csv = buildCsvFromPayload(result.data);
          downloadBlob(reportFilename(result.data, "csv"), new Blob([csv], { type: "text/csv;charset=utf-8" }));
          toast.success("CSV downloaded.");
          return;
        }
        const buffer = await buildWorkbookFromPayload(result.data);
        downloadBlob(
          reportFilename(result.data, "xlsx"),
          new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          }),
        );
        toast.success("Excel downloaded.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Report failed.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <Card className="border-navy-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-navy-950">Report filters</CardTitle>
          <CardDescription>Shared date range and scope for every report preview or export.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="startDate">Start date</Label>
            <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="endDate">End date</Label>
            <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Branch</Label>
            <InlineCombobox
              value={scopeId}
              options={branches}
              allowNone
              placeholder="All branches"
              className="h-9 w-full"
              onValueChange={setScopeId}
            />
          </div>
          <div className="space-y-1">
            <Label>Department</Label>
            <InlineCombobox
              value={departmentId}
              options={departments}
              allowNone
              placeholder="All departments"
              className="h-9 w-full"
              onValueChange={setDepartmentId}
            />
          </div>
          <div className="space-y-1">
            <Label>Category</Label>
            <InlineCombobox
              value={categoryId}
              options={categories}
              allowNone
              placeholder="All categories"
              className="h-9 w-full"
              onValueChange={setCategoryId}
            />
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <InlineCombobox
              value={status}
              options={statusOptions}
              allowNone
              placeholder="All statuses"
              className="h-9 w-full"
              onValueChange={setStatus}
            />
          </div>
          <div className="space-y-1">
            <Label>Condition</Label>
            <InlineCombobox
              value={condition}
              options={conditionOptions}
              allowNone
              placeholder="All conditions"
              className="h-9 w-full"
              onValueChange={setCondition}
            />
          </div>
          <div className="space-y-1">
            <Label>Asset</Label>
            <AssetLookupPicker
              value={assetId}
              seed={assetSeed}
              allowNone
              noneLabel="All assets"
              placeholder="All assets"
              className="h-9 w-full"
              onValueChange={setAssetId}
            />
          </div>
          <div className="space-y-1 md:col-span-2 xl:col-span-4">
            <Label htmlFor="reportSearch">Search</Label>
            <Input
              id="reportSearch"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, AIN, or serial"
              className="border-navy-200"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {catalog.map((entry) => (
          <Card key={entry.id} className="border-navy-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-navy-950">{entry.name}</CardTitle>
              <CardDescription>
                {entry.description}
                <span className="mt-1 block text-xs text-navy-900/55">
                  {entry.category} · {entry.audience}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="cursor-pointer bg-navy-900 hover:bg-navy-950"
                disabled={pending}
                onClick={() => run(entry, "preview")}
              >
                Preview
              </Button>
              {canExport ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer border-navy-200"
                    disabled={pending}
                    onClick={() => run(entry, "csv")}
                  >
                    CSV
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer border-navy-200"
                    disabled={pending}
                    onClick={() => run(entry, "xlsx")}
                  >
                    Excel
                  </Button>
                </>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{preview?.reportName ?? "Report preview"}</DialogTitle>
          </DialogHeader>
          {preview ? (
            <DialogBody className="space-y-6 pb-2">
              <p className="text-sm text-navy-900/70">
                {preview.scopeName} · {new Date(preview.period.startDate).toLocaleDateString()} –{" "}
                {new Date(preview.period.endDate).toLocaleDateString()} · Generated{" "}
                {new Date(preview.generatedAt).toLocaleString()}
              </p>
              {payloadTables(preview).map((table) => (
                <ReportPreviewTable
                  key={`${preview.reportId}-${preview.generatedAt}-${table.title}`}
                  title={table.title}
                  rows={table.rows}
                />
              ))}
            </DialogBody>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" className="cursor-pointer border-navy-200" onClick={() => setPreview(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function reportsCanExport(perms: readonly string[]) {
  return canExportReports(perms);
}
