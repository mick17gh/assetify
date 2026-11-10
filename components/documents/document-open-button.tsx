"use client";

import { useMemo, useState } from "react";
import { Download, Eye, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PreviewKind = "pdf" | "image" | "other";

const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"]);

function extensionOf(fileName: string, fileUrl: string) {
  const fromName = fileName.split(".").pop()?.toLowerCase().trim();
  if (fromName && fromName !== fileName.toLowerCase()) return fromName;
  try {
    const path = new URL(fileUrl, "http://local").pathname;
    return path.split(".").pop()?.toLowerCase().trim() ?? "";
  } catch {
    return "";
  }
}

function previewKind(fileName: string, fileUrl: string): PreviewKind {
  const ext = extensionOf(fileName, fileUrl);
  if (ext === "pdf") return "pdf";
  if (IMAGE_EXT.has(ext)) return "image";
  return "other";
}

export function DocumentOpenButton({
  fileUrl,
  fileName,
  className,
  label = "Artifact",
}: {
  fileUrl: string;
  fileName: string;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const kind = useMemo(() => previewKind(fileName, fileUrl), [fileName, fileUrl]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={`cursor-pointer border-navy-200 hover:bg-navy-50 ${className ?? ""}`}
        onClick={() => setOpen(true)}
        aria-label={`Preview ${fileName}`}
      >
        <Eye className="mr-1.5 h-3.5 w-3.5" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-6">{fileName}</DialogTitle>
            <DialogDescription>
              {kind === "pdf"
                ? "PDF preview"
                : kind === "image"
                  ? "Image preview"
                  : "This file type can’t be previewed in the browser."}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="px-0">
            {kind === "pdf" ? (
              <div className="overflow-hidden rounded-lg border border-navy-100 bg-navy-50">
                <iframe
                  title={`Preview of ${fileName}`}
                  src={`${fileUrl}#toolbar=1&navpanes=0`}
                  className="h-[min(70vh,720px)] w-full bg-white"
                />
              </div>
            ) : null}

            {kind === "image" ? (
              <div className="flex min-h-[240px] items-center justify-center overflow-hidden rounded-lg border border-navy-100 bg-navy-50/60 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary CDN document URLs */}
                <img
                  src={fileUrl}
                  alt={fileName}
                  className="max-h-[min(70vh,720px)] max-w-full rounded-md object-contain"
                />
              </div>
            ) : null}

            {kind === "other" ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-navy-200 bg-navy-50/40 px-6 py-12 text-center">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-navy-100">
                  <FileText className="h-5 w-5 text-navy-700" />
                </div>
                <p className="text-sm font-medium text-navy-950">No in-app preview</p>
                <p className="mt-1 max-w-sm text-xs text-navy-900/60">
                  Download the file or open it in a new tab to view it with your device’s apps.
                </p>
              </div>
            ) : null}
          </DialogBody>

          <DialogFooter className="sm:justify-between">
            <p className="hidden text-xs text-navy-900/50 sm:block">
              {kind === "other" ? "Preview unavailable" : "In-app preview"}
            </p>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button variant="outline" asChild className="cursor-pointer border-navy-200">
                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Open in new tab
                </a>
              </Button>
              <Button asChild className="cursor-pointer bg-navy-900 hover:bg-navy-950">
                <a href={fileUrl} download={fileName} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download
                </a>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
