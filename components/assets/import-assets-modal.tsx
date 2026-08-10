"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, FileSpreadsheet, Loader2, Download, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  API_ROUTES,
  ASSET_CONDITION,
  ASSET_STATUS,
  ENUM_LABELS,
  REGEX,
} from "@/constants";
import { parseCsv, validateImportRows } from "@/lib/import-parser";
import { InlineCombobox, type ReferenceOption } from "@/components/shared/reference-selects";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type LocationRefs = {
  departments: Array<{ id: string; name: string; branchId: string }>;
  rooms: Array<{ id: string; name: string; branchId: string }>;
  shelves: Array<{ id: string; name: string; roomId: string }>;
};

type PreviewRow = {
  key: string;
  rowNumber: number;
  ain: string;
  serialNumber: string;
  name: string;
  purchaseDate: string;
  purchaseCost: string;
  warrantyExpiryDate: string;
  categoryId: string;
  branchId: string;
  departmentId: string;
  roomId: string;
  shelfId: string;
  vendorId: string;
  custodianId: string;
  status: string;
  condition: string;
  categoryHint: string;
  branchHint: string;
};

type ConfirmResponse = {
  totalRows: number;
  successRows: number;
  failedRows: number;
  failures?: Array<{ row: number; error: string }>;
  error?: string;
};

function matchCategoryId(hint: string, categories: ReferenceOption[]) {
  const needle = hint.trim().toLowerCase();
  if (!needle) return "";
  return categories.find((c) => c.label.toLowerCase() === needle)?.id ?? "";
}

function matchBranchId(hint: string, branches: ReferenceOption[]) {
  const needle = hint.trim().toUpperCase();
  if (!needle) return "";
  return (
    branches.find((b) => (b.code ?? "").toUpperCase() === needle)?.id ??
    branches.find((b) => b.label.toUpperCase().includes(`(${needle})`))?.id ??
    ""
  );
}

function matchByName(hint: string, options: Array<{ id: string; name: string }>) {
  const needle = hint.trim().toLowerCase();
  if (!needle) return "";
  return options.find((option) => option.name.toLowerCase() === needle)?.id ?? "";
}

function matchVendorId(hint: string, vendors: ReferenceOption[]) {
  const needle = hint.trim().toLowerCase();
  if (!needle) return "";
  return vendors.find((v) => v.label.toLowerCase() === needle)?.id ?? "";
}

function matchCustodianId(hint: string, custodians: ReferenceOption[]) {
  const needle = hint.trim().toLowerCase();
  if (!needle) return "";
  return (
    custodians.find((c) => c.label.toLowerCase().includes(`(${needle})`))?.id ??
    custodians.find((c) => c.label.toLowerCase() === needle)?.id ??
    custodians.find((c) => c.label.toLowerCase().startsWith(`${needle} (`))?.id ??
    ""
  );
}

function matchEnumValue(
  raw: string,
  values: Record<string, string>,
  labels: Record<string, string>,
  fallback: string,
) {
  const needle = raw.trim();
  if (!needle) return fallback;
  const normalized = needle.toUpperCase().replace(/[\s-]+/g, "_");
  if (Object.values(values).includes(normalized)) return normalized;
  const byLabel = Object.entries(labels).find(([, label]) => label.toLowerCase() === needle.toLowerCase());
  return byLabel?.[0] ?? fallback;
}

function rowFieldErrors(row: PreviewRow): string[] {
  const errors: string[] = [];
  if (!REGEX.AIN.test(row.ain)) errors.push("Invalid AIN");
  if (!REGEX.SERIAL.test(row.serialNumber)) errors.push("Invalid serial");
  if (row.name.trim().length < 2) errors.push("Name required");
  if (!row.purchaseDate) errors.push("Purchase date required");
  if (!REGEX.CURRENCY.test(row.purchaseCost)) errors.push("Invalid cost");
  if (!row.categoryId) errors.push("Category required");
  if (!row.branchId) errors.push("Branch required");
  return errors;
}

function PreviewCellInput({
  value,
  onChange,
  error,
  type = "text",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  type?: string;
  className?: string;
}) {
  return (
    <Input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "h-8 min-w-[110px] border-purple-200 px-2 text-xs",
        error && "border-red-400",
        className,
      )}
    />
  );
}

function yieldToBrowser() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0);
  });
}

function mapImportItemToPreviewRow(
  item: ReturnType<typeof validateImportRows>[number],
  refs: {
    branches: ReferenceOption[];
    categories: ReferenceOption[];
    vendors: ReferenceOption[];
    custodians: ReferenceOption[];
    locations: LocationRefs;
  },
): PreviewRow {
  const branchId = matchBranchId(item.data.branchCode, refs.branches);
  const roomId = matchByName(
    item.data.roomName,
    refs.locations.rooms.filter((r) => !branchId || r.branchId === branchId),
  );
  return {
    key: `row-${item.row}-${item.data.ain || Math.random().toString(36).slice(2)}`,
    rowNumber: item.row,
    ain: item.data.ain,
    serialNumber: item.data.serialNumber,
    name: item.data.name,
    purchaseDate: item.data.purchaseDate,
    purchaseCost: item.data.purchaseCost,
    warrantyExpiryDate: item.data.warrantyExpiryDate,
    categoryHint: item.data.categoryName,
    branchHint: item.data.branchCode,
    categoryId: matchCategoryId(item.data.categoryName, refs.categories),
    branchId,
    departmentId: matchByName(
      item.data.departmentName,
      refs.locations.departments.filter((d) => !branchId || d.branchId === branchId),
    ),
    roomId,
    shelfId: matchByName(
      item.data.shelfName,
      refs.locations.shelves.filter((s) => !roomId || s.roomId === roomId),
    ),
    vendorId: matchVendorId(item.data.vendorName, refs.vendors),
    custodianId: matchCustodianId(item.data.custodianEmail, refs.custodians),
    status: matchEnumValue(
      item.data.status,
      ASSET_STATUS,
      ENUM_LABELS.assetStatus,
      ASSET_STATUS.ACTIVE,
    ),
    condition: matchEnumValue(
      item.data.condition,
      ASSET_CONDITION,
      ENUM_LABELS.assetCondition,
      ASSET_CONDITION.GOOD,
    ),
  };
}

export function ImportAssetsModal({
  branches,
  categories,
  vendors,
  custodians,
  locations,
}: {
  branches: ReferenceOption[];
  categories: ReferenceOption[];
  vendors: ReferenceOption[];
  custodians: ReferenceOption[];
  locations: LocationRefs;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [fileName, setFileName] = useState("import.csv");
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState<{ done: number; total: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConfirmResponse | null>(null);

  const reset = () => {
    setStep("upload");
    setFileName("import.csv");
    setRows([]);
    setParsing(false);
    setParseProgress(null);
    setSubmitting(false);
    setError(null);
    setResult(null);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const handleFile = async (file: File | null) => {
    setError(null);
    setResult(null);
    if (!file) return;

    setParsing(true);
    setParseProgress(null);
    // Give the spinner time to paint and start CSS animation before heavy work.
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 80);
    });

    try {
      const content = await file.text();
      await yieldToBrowser();

      const parsed = validateImportRows(parseCsv(content));
      if (!parsed.length) {
        setError("No data rows found in the CSV.");
        toast.error("No data rows found in the CSV.");
        return;
      }

      const previewRows: PreviewRow[] = [];
      const batchSize = 15;
      const refs = { branches, categories, vendors, custodians, locations };
      setParseProgress({ done: 0, total: parsed.length });

      for (let i = 0; i < parsed.length; i += batchSize) {
        const batch = parsed.slice(i, i + batchSize);
        for (const item of batch) {
          previewRows.push(mapImportItemToPreviewRow(item, refs));
        }
        setParseProgress({ done: Math.min(i + batch.length, parsed.length), total: parsed.length });
        await yieldToBrowser();
      }

      setFileName(file.name);
      setRows(previewRows);
      setStep("preview");
    } catch {
      setError("Could not parse the CSV file.");
      toast.error("Could not parse the CSV file.");
    } finally {
      setParsing(false);
      setParseProgress(null);
    }
  };

  const updateRow = (key: string, patch: Partial<PreviewRow>) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.key !== key) return row;
        const next = { ...row, ...patch };
        if (patch.branchId !== undefined && patch.branchId !== row.branchId) {
          next.departmentId = "";
          next.roomId = "";
          next.shelfId = "";
        }
        if (patch.roomId !== undefined && patch.roomId !== row.roomId) {
          next.shelfId = "";
        }
        return next;
      }),
    );
  };

  const removeRow = (key: string) => {
    setRows((prev) => prev.filter((row) => row.key !== key));
  };

  const rowErrors = useMemo(() => new Map(rows.map((row) => [row.key, rowFieldErrors(row)])), [rows]);
  const invalidCount = useMemo(
    () => Array.from(rowErrors.values()).filter((errs) => errs.length > 0).length,
    [rowErrors],
  );
  const unmatchedLookups = useMemo(
    () =>
      rows.filter(
        (row) =>
          (row.categoryHint && !row.categoryId) || (row.branchHint && !row.branchId),
      ).length,
    [rows],
  );

  const handleConfirm = async () => {
    if (!rows.length || submitting) return;
    if (invalidCount > 0) {
      const message = `Fix ${invalidCount} row${invalidCount === 1 ? "" : "s"} before importing.`;
      setError(message);
      toast.error(message);
      return;
    }

    setError(null);
    setResult(null);
    setSubmitting(true);
    try {
      const response = await fetch(API_ROUTES.CSV_IMPORT_CONFIRM, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName,
          rows: rows.map((row) => ({
            row: row.rowNumber,
            ain: row.ain.trim().toUpperCase(),
            serialNumber: row.serialNumber.trim(),
            name: row.name.trim(),
            purchaseDate: row.purchaseDate,
            purchaseCost: row.purchaseCost.trim(),
            warrantyExpiryDate: row.warrantyExpiryDate || "",
            categoryId: row.categoryId,
            branchId: row.branchId,
            departmentId: row.departmentId || "",
            roomId: row.roomId || "",
            shelfId: row.shelfId || "",
            vendorId: row.vendorId || "",
            custodianId: row.custodianId || "",
            status: row.status,
            condition: row.condition,
          })),
        }),
      });
      const payload = (await response.json()) as ConfirmResponse;
      if (!response.ok) {
        const message = payload.error ?? "Import failed.";
        setError(message);
        toast.error(message);
        return;
      }

      setResult(payload);
      if (payload.failedRows) {
        const sample = (payload.failures ?? [])
          .slice(0, 5)
          .map((f) => `Row ${f.row}: ${f.error}`)
          .join(" · ");
        toast.error(
          `Imported ${payload.successRows} of ${payload.totalRows} rows.${sample ? ` ${sample}` : ""}`,
        );
        if (payload.failures?.length) {
          const failedRowNumbers = new Set(payload.failures.map((f) => f.row));
          setRows((prev) => prev.filter((row) => failedRowNumbers.has(row.rowNumber)));
        }
      } else {
        toast.success(`Imported ${payload.successRows} of ${payload.totalRows} rows.`);
        handleOpenChange(false);
      }
      router.refresh();
    } catch {
      const message = "Import failed. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="cursor-pointer border-purple-200">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          "flex max-h-[90vh] flex-col gap-4 overflow-hidden",
          step === "preview" ? "sm:max-w-[95vw]" : "sm:max-w-lg",
        )}
      >
        <DialogHeader>
          <DialogTitle>{step === "upload" ? "Import Assets" : "Preview & map import"}</DialogTitle>
          <DialogDescription>
            {step === "upload"
              ? "Download the CSV template (same fields as Create Asset). Optional columns can be left blank and mapped in preview."
              : "Review every row, fix fields, and map lookups. Import only after everything looks right."}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" ? (
          <div className="space-y-4">
            <Button
              variant="outline"
              asChild
              className={cn("w-full cursor-pointer border-purple-200", parsing && "pointer-events-none opacity-60")}
            >
              <a href={API_ROUTES.CSV_IMPORT_TEMPLATE} download>
                <Download className="mr-2 h-4 w-4" />
                Download CSV template
              </a>
            </Button>
            <Input
              type="file"
              accept=".csv,text/csv"
              disabled={parsing}
              onChange={(event) => {
                const selected = event.target.files?.[0] ?? null;
                void handleFile(selected);
                event.target.value = "";
              }}
            />
            {parsing ? (
              <div className="flex items-center justify-center gap-3 rounded-md border border-purple-100 bg-purple-50/60 px-4 py-6 text-sm text-purple-900">
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#7C3AED]" />
                <div>
                  <p className="font-medium">Preparing preview…</p>
                  <p className="text-xs text-purple-900/70">
                    {parseProgress
                      ? `Matching lookups ${parseProgress.done} of ${parseProgress.total}`
                      : "Reading file and parsing rows"}
                  </p>
                </div>
              </div>
            ) : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-purple-900/75">
                <span className="font-medium text-purple-950">{rows.length}</span> rows from{" "}
                <span className="font-medium">{fileName}</span>
                {unmatchedLookups > 0 ? (
                  <span className="ml-2 text-amber-700">
                    · {unmatchedLookups} need Category/Branch mapping
                  </span>
                ) : null}
                {invalidCount > 0 ? (
                  <span className="ml-2 text-red-600">· {invalidCount} with errors</span>
                ) : (
                  <span className="ml-2 text-emerald-700">· Ready to import</span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="cursor-pointer"
                onClick={() => {
                  setStep("upload");
                  setRows([]);
                  setResult(null);
                  setError(null);
                }}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Choose another file
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto rounded-md border border-purple-100">
              <table className="w-max min-w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10 bg-purple-50 text-[11px] uppercase tracking-wide text-purple-900/70">
                  <tr>
                    <th className="px-2 py-2">#</th>
                    <th className="px-2 py-2">AIN</th>
                    <th className="px-2 py-2">Serial</th>
                    <th className="px-2 py-2">Name</th>
                    <th className="px-2 py-2">Purchase date</th>
                    <th className="px-2 py-2">Cost</th>
                    <th className="px-2 py-2">Warranty</th>
                    <th className="px-2 py-2">Category</th>
                    <th className="px-2 py-2">Branch</th>
                    <th className="px-2 py-2">Department</th>
                    <th className="px-2 py-2">Room</th>
                    <th className="px-2 py-2">Shelf</th>
                    <th className="px-2 py-2">Vendor</th>
                    <th className="px-2 py-2">Custodian</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Condition</th>
                    <th className="px-2 py-2">Issues</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const errors = rowErrors.get(row.key) ?? [];
                    const departments = locations.departments
                      .filter((d) => d.branchId === row.branchId)
                      .map((d) => ({ id: d.id, label: d.name }));
                    const rooms = locations.rooms
                      .filter((r) => r.branchId === row.branchId)
                      .map((r) => ({ id: r.id, label: r.name }));
                    const shelves = locations.shelves
                      .filter((s) => s.roomId === row.roomId)
                      .map((s) => ({ id: s.id, label: s.name }));

                    return (
                      <tr key={row.key} className="border-t border-purple-50 align-top">
                        <td className="px-2 py-1.5 text-purple-900/60">{row.rowNumber}</td>
                        <td className="px-2 py-1.5">
                          <PreviewCellInput
                            value={row.ain}
                            error={errors.some((e) => e.includes("AIN"))}
                            onChange={(ain) => updateRow(row.key, { ain: ain.toUpperCase() })}
                            className="min-w-[130px] font-mono"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <PreviewCellInput
                            value={row.serialNumber}
                            error={errors.some((e) => e.includes("serial"))}
                            onChange={(serialNumber) => updateRow(row.key, { serialNumber })}
                            className="min-w-[120px] font-mono"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <PreviewCellInput
                            value={row.name}
                            error={errors.some((e) => e.includes("Name"))}
                            onChange={(name) => updateRow(row.key, { name })}
                            className="min-w-[160px]"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <PreviewCellInput
                            type="date"
                            value={row.purchaseDate}
                            error={errors.some((e) => e.includes("date"))}
                            onChange={(purchaseDate) => updateRow(row.key, { purchaseDate })}
                            className="min-w-[140px]"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <PreviewCellInput
                            value={row.purchaseCost}
                            error={errors.some((e) => e.includes("cost"))}
                            onChange={(purchaseCost) => updateRow(row.key, { purchaseCost })}
                            className="min-w-[90px]"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <PreviewCellInput
                            type="date"
                            value={row.warrantyExpiryDate}
                            onChange={(warrantyExpiryDate) => updateRow(row.key, { warrantyExpiryDate })}
                            className="min-w-[140px]"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <div className="space-y-1">
                            <InlineCombobox
                              value={row.categoryId}
                              options={categories}
                              error={!row.categoryId}
                              placeholder={row.categoryHint || "Category"}
                              onValueChange={(categoryId) => updateRow(row.key, { categoryId })}
                            />
                            {row.categoryHint && !row.categoryId ? (
                              <p className="max-w-[160px] truncate text-[10px] text-amber-700" title={row.categoryHint}>
                                CSV: {row.categoryHint}
                              </p>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-2 py-1.5">
                          <div className="space-y-1">
                            <InlineCombobox
                              value={row.branchId}
                              options={branches}
                              error={!row.branchId}
                              placeholder={row.branchHint || "Branch"}
                              onValueChange={(branchId) => updateRow(row.key, { branchId })}
                            />
                            {row.branchHint && !row.branchId ? (
                              <p className="max-w-[160px] truncate text-[10px] text-amber-700" title={row.branchHint}>
                                CSV: {row.branchHint}
                              </p>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-2 py-1.5">
                          <InlineCombobox
                            value={row.departmentId}
                            options={departments}
                            allowNone
                            placeholder="None"
                            onValueChange={(departmentId) => updateRow(row.key, { departmentId })}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <InlineCombobox
                            value={row.roomId}
                            options={rooms}
                            allowNone
                            placeholder="None"
                            onValueChange={(roomId) => updateRow(row.key, { roomId })}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <InlineCombobox
                            value={row.shelfId}
                            options={shelves}
                            allowNone
                            placeholder="None"
                            onValueChange={(shelfId) => updateRow(row.key, { shelfId })}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <InlineCombobox
                            value={row.vendorId}
                            options={vendors}
                            allowNone
                            placeholder="None"
                            onValueChange={(vendorId) => updateRow(row.key, { vendorId })}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <InlineCombobox
                            value={row.custodianId}
                            options={custodians}
                            allowNone
                            placeholder="None"
                            onValueChange={(custodianId) => updateRow(row.key, { custodianId })}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Select
                            value={row.status}
                            onValueChange={(status) => updateRow(row.key, { status })}
                          >
                            <SelectTrigger className="h-8 min-w-[120px] cursor-pointer border-purple-200 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(ASSET_STATUS).map((status) => (
                                <SelectItem key={status} value={status}>
                                  {ENUM_LABELS.assetStatus[status] ?? status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-1.5">
                          <Select
                            value={row.condition}
                            onValueChange={(condition) => updateRow(row.key, { condition })}
                          >
                            <SelectTrigger className="h-8 min-w-[110px] cursor-pointer border-purple-200 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(ASSET_CONDITION).map((condition) => (
                                <SelectItem key={condition} value={condition}>
                                  {ENUM_LABELS.assetCondition[condition] ?? condition}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="max-w-[140px] px-2 py-1.5">
                          {errors.length ? (
                            <p className="text-[10px] leading-snug text-red-600">{errors.join("; ")}</p>
                          ) : (
                            <span className="text-[10px] text-emerald-600">OK</span>
                          )}
                        </td>
                        <td className="px-2 py-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-red-600"
                            onClick={() => removeRow(row.key)}
                            aria-label={`Remove row ${row.rowNumber}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => void handleConfirm()}
                disabled={!rows.length || submitting || invalidCount > 0}
                className="w-full cursor-pointer bg-[#7C3AED] hover:bg-[#6D28D9]"
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {submitting ? "Importing..." : `Confirm import (${rows.length})`}
              </Button>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              {result ? (
                <p className="text-sm text-purple-900/75">
                  Imported {result.successRows} of {result.totalRows} rows
                  {result.failedRows ? ` (${result.failedRows} failed)` : ""}.
                </p>
              ) : null}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
