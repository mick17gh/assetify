"use client";

import { useState } from "react";
import { FileText, Loader2, MoreHorizontal, Paperclip, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteMaintenanceAction,
  updateMaintenanceAction,
} from "@/app/(dashboard)/maintenance/actions";
import { SetupTextField } from "@/components/settings/setup-create-modal";
import { EnumSelect } from "@/components/shared/enum-select";
import { AssetLookupSelect } from "@/components/shared/entity-lookups";
import { SubmitButton } from "@/components/shared/submit-button";
import { PendingForm } from "@/components/shared/pending-form";
import { MaintenanceDocumentUpload } from "@/components/maintenance/maintenance-document-upload";
import { DocumentOpenButton } from "@/components/documents/document-open-button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PickerOption } from "@/lib/lookups/types";
import { MAINTENANCE_STATUS, REPAIR_OUTCOME } from "@/constants";

type MaintenanceDocument = { id: string; fileName: string; displayName?: string; fileUrl: string };

function displayFileName(fileName: string) {
  // Storage keys are often "{timestamp}-{uuid}-{original}". Prefer a short, readable label.
  const parts = fileName.split("-");
  if (parts.length >= 3 && /^\d+$/.test(parts[0] ?? "")) {
    const rest = parts.slice(6).join("-");
    if (rest) return rest;
  }
  if (fileName.length > 36) return `${fileName.slice(0, 18)}…${fileName.slice(-10)}`;
  return fileName;
}

export function MaintenanceRowActions({
  recordId,
  assetId,
  description,
  notes = "",
  serviceDate,
  cost,
  vendorName,
  nextServiceDate,
  reportedDate = "",
  sentDate = "",
  actualReturnDate = "",
  warrantyClaim = false,
  status,
  repairOutcome = "",
  assetSeed,
  assetLabel,
  documents = [],
  canUpload = false,
}: {
  recordId: string;
  assetId: string;
  description: string;
  notes?: string;
  serviceDate: string;
  cost: string;
  vendorName: string;
  nextServiceDate: string;
  reportedDate?: string;
  sentDate?: string;
  actualReturnDate?: string;
  warrantyClaim?: boolean;
  status: string;
  repairOutcome?: string;
  assetSeed: PickerOption[];
  assetLabel: string;
  documents?: MaintenanceDocument[];
  canUpload?: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="flex items-center justify-end gap-2">
      <MaintenanceDocumentUpload recordId={recordId} canUpload={canUpload} />

      <Dialog open={attachmentsOpen} onOpenChange={setAttachmentsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Attached invoices</DialogTitle>
            <DialogDescription>
              {documents.length === 0
                ? "No invoices attached to this maintenance record yet."
                : `${documents.length} file${documents.length === 1 ? "" : "s"} attached.`}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            {documents.length === 0 ? (
              <p className="text-sm text-navy-900/65">Upload an invoice using the Invoice button.</p>
            ) : (
              <ul className="space-y-2">
                {documents.map((doc) => {
                  const name = doc.displayName ?? displayFileName(doc.fileName);
                  return (
                    <li
                      key={doc.id}
                      className="flex items-center gap-3 rounded-lg border border-navy-100 bg-navy-50/50 px-3 py-2.5 text-sm text-navy-950"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-navy-900 shadow-sm">
                        <FileText className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium" title={name}>
                        {name}
                      </span>
                      <DocumentOpenButton fileUrl={doc.fileUrl} fileName={name} label="View" />
                    </li>
                  );
                })}
              </ul>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update maintenance record</DialogTitle>
          </DialogHeader>
          <PendingForm
            action={updateMaintenanceAction}
            onSuccess={() => setEditOpen(false)}
            successMessage="Maintenance record updated."
            className="flex min-h-0 min-w-0 flex-1 flex-col"
          >
            <DialogBody className="min-w-0 space-y-3 pb-2">
              <input type="hidden" name="id" value={recordId} />
              <AssetLookupSelect
                name="assetId"
                value={assetId}
                seed={[{ id: assetId, label: assetLabel }, ...assetSeed.filter((item) => item.id !== assetId)]}
                required
              />
              <SetupTextField name="description" label="Description" required minLength={3} maxLength={2000} defaultValue={description} />
              <SetupTextField name="serviceDate" label="Service date" type="date" required defaultValue={serviceDate} />
              <SetupTextField name="reportedDate" label="Date reported" type="date" defaultValue={reportedDate} />
              <SetupTextField name="sentDate" label="Date sent" type="date" defaultValue={sentDate} />
              <SetupTextField name="actualReturnDate" label="Actual return" type="date" defaultValue={actualReturnDate} />
              <SetupTextField name="cost" label="Cost" defaultValue={cost} />
              <SetupTextField name="vendorName" label="Vendor name" defaultValue={vendorName} maxLength={120} />
              <SetupTextField name="nextServiceDate" label="Next service date" type="date" defaultValue={nextServiceDate} />
              <div className="min-w-0 space-y-1">
                <Label htmlFor={`notes-${recordId}`}>Notes</Label>
                <Textarea
                  id={`notes-${recordId}`}
                  name="notes"
                  maxLength={4000}
                  defaultValue={notes}
                  placeholder="Additional notes (optional)"
                  className="min-w-0"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-navy-900">
                <input
                  type="checkbox"
                  name="warrantyClaim"
                  value="true"
                  defaultChecked={warrantyClaim}
                  className="h-4 w-4"
                />
                Warranty claim
              </label>
              <EnumSelect
                name="status"
                label="Status"
                labelKey="maintenanceStatus"
                values={MAINTENANCE_STATUS}
                defaultValue={status}
                required
              />
              <EnumSelect
                name="repairOutcome"
                label="Repair outcome"
                labelKey="repairOutcome"
                values={REPAIR_OUTCOME}
                defaultValue={repairOutcome || undefined}
              />
            </DialogBody>
            <DialogFooter>
              <SubmitButton idleLabel="Update" pendingLabel="Updating..." className="w-full cursor-pointer sm:w-auto" />
            </DialogFooter>
          </PendingForm>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete record?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer" disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer bg-red-600 hover:bg-red-700"
              disabled={deleting}
              onClick={async (event) => {
                event.preventDefault();
                setDeleting(true);
                try {
                  const formData = new FormData();
                  formData.set("id", recordId);
                  await deleteMaintenanceAction(formData);
                  setDeleteOpen(false);
                  toast.success("Maintenance record deleted.");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Delete failed.");
                } finally {
                  setDeleting(false);
                }
              }}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer border-navy-200">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setAttachmentsOpen(true);
            }}
          >
            <Paperclip className="mr-2 h-4 w-4" />
            Attachments{documents.length ? ` (${documents.length})` : ""}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setEditOpen(true);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-700 focus:text-red-700"
            onSelect={(event) => {
              event.preventDefault();
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
