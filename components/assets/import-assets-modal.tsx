"use client";

import { useState } from "react";
import { FileSpreadsheet, Loader2, Download, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { API_ROUTES } from "@/constants";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type ImportResponse = {
  totalRows: number;
  successRows: number;
  failedRows: number;
};

export function ImportAssetsModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);

  const handleImport = async () => {
    if (!file || submitting) return;
    setError(null);
    setResult(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch(API_ROUTES.CSV_IMPORT, {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as Partial<ImportResponse> & { error?: string };
      if (!response.ok) {
        const message = payload.error ?? "Import failed.";
        setError(message);
        toast.error(message);
        return;
      }
      const summary = {
        totalRows: payload.totalRows ?? 0,
        successRows: payload.successRows ?? 0,
        failedRows: payload.failedRows ?? 0,
      };
      setResult(summary);
      toast.success(`Imported ${summary.successRows} of ${summary.totalRows} rows.`);
      router.refresh();
      if (!summary.failedRows) setOpen(false);
    } catch {
      const message = "Import failed. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="cursor-pointer border-purple-200">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Assets</DialogTitle>
          <DialogDescription>
            Download the CSV template, fill in your asset rows, then upload the file to import.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Button variant="outline" asChild className="w-full cursor-pointer border-purple-200">
            <a href={API_ROUTES.CSV_IMPORT_TEMPLATE} download>
              <Download className="mr-2 h-4 w-4" />
              Download CSV template
            </a>
          </Button>
          <Input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
            }}
          />
          <Button
            onClick={handleImport}
            disabled={!file || submitting}
            className="w-full cursor-pointer bg-[#7C3AED] hover:bg-[#6D28D9]"
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {submitting ? "Importing..." : "Import Assets"}
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {result ? (
            <p className="text-sm text-purple-900/75">
              Imported {result.successRows} of {result.totalRows} rows
              {result.failedRows ? ` (${result.failedRows} failed)` : ""}.
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
