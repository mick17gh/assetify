"use client";

import { useState } from "react";
import { MoreHorizontal, PencilLine, PlusCircle, RefreshCw, Trash2, Upload } from "lucide-react";
import {
  createWorkOrderAction,
  disposeAssetAction,
  updateAssetDetailsAction,
  updateAssetStatusAction,
  uploadAssetDocumentAction,
  uploadAssetPhotoAction,
} from "@/app/(dashboard)/assets/[assetId]/actions";
import { ASSET_CONDITION, ASSET_STATUS, DOCUMENT_TYPE } from "@/constants";
import { EnumSelect } from "@/components/shared/enum-select";
import { SetupTextField } from "@/components/settings/setup-create-modal";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { enqueueOfflineOperation } from "@/hooks/use-offline-queue";

export function AssetDetailsActions({
  assetId,
  initialName,
  initialDescription,
  initialStatus,
  initialCondition,
}: {
  assetId: string;
  initialName: string;
  initialDescription: string;
  initialStatus: string;
  initialCondition: string;
}) {
  const [docType, setDocType] = useState<string>(DOCUMENT_TYPE.OTHER);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button className="cursor-pointer bg-[#7C3AED] hover:bg-[#6D28D9]">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Work Order
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Work Order</DialogTitle>
            <DialogDescription>Add a maintenance work order from asset details.</DialogDescription>
          </DialogHeader>
          <form
            action={async (formData) => {
              if (!navigator.onLine) {
                enqueueOfflineOperation({
                  type: "maintenance.create",
                  payload: {
                    assetId: String(formData.get("assetId") ?? ""),
                    description: String(formData.get("description") ?? ""),
                    serviceDate: String(formData.get("dueDate") ?? new Date().toISOString().slice(0, 10)),
                  },
                });
                return;
              }
              await createWorkOrderAction(formData);
            }}
            className="space-y-3"
          >
            <input type="hidden" name="assetId" value={assetId} />
            <div className="space-y-1">
              <Label htmlFor="description">Issue / Task</Label>
              <Textarea id="description" name="description" required />
            </div>
            <SetupTextField name="dueDate" label="Due Date" type="date" />
            <SubmitButton idleLabel="Create" pendingLabel="Creating..." className="w-full cursor-pointer" />
          </form>
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="cursor-pointer border-purple-200">
            <MoreHorizontal className="mr-2 h-4 w-4" />
            More
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <Dialog>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                <PencilLine className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Asset</DialogTitle>
                <DialogDescription>Update core asset profile fields.</DialogDescription>
              </DialogHeader>
              <form action={updateAssetDetailsAction} className="space-y-3">
                <input type="hidden" name="assetId" value={assetId} />
                <SetupTextField name="name" label="Name" required defaultValue={initialName} />
                <div className="space-y-1">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" defaultValue={initialDescription} />
                </div>
                <SubmitButton idleLabel="Save changes" pendingLabel="Saving..." className="w-full cursor-pointer bg-[#7C3AED] hover:bg-[#6D28D9]" />
              </form>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Change Status
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Status</DialogTitle>
              </DialogHeader>
              <form action={updateAssetStatusAction} className="space-y-3">
                <input type="hidden" name="assetId" value={assetId} />
                <EnumSelect name="status" label="Status" labelKey="assetStatus" values={ASSET_STATUS} defaultValue={initialStatus} required />
                <EnumSelect name="condition" label="Condition" labelKey="assetCondition" values={ASSET_CONDITION} defaultValue={initialCondition} required />
                <SetupTextField name="note" label="Note" />
                <SubmitButton idleLabel="Update status" pendingLabel="Updating..." className="w-full cursor-pointer" />
              </form>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Photo
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Asset Photo</DialogTitle>
              </DialogHeader>
              <form action={uploadAssetPhotoAction} className="space-y-3">
                <input type="hidden" name="assetId" value={assetId} />
                <div className="space-y-1">
                  <Label htmlFor="photo">Photo</Label>
                  <Input id="photo" name="photo" type="file" accept="image/*" required />
                </div>
                <SubmitButton idleLabel="Upload photo" pendingLabel="Uploading..." className="w-full cursor-pointer" />
              </form>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Asset Document</DialogTitle>
              </DialogHeader>
              <form action={uploadAssetDocumentAction} className="space-y-3">
                <input type="hidden" name="assetId" value={assetId} />
                <EnumSelect
                  name="documentType"
                  label="Document Type"
                  labelKey="documentType"
                  values={DOCUMENT_TYPE}
                  value={docType}
                  onValueChange={setDocType}
                  required
                />
                <div className="space-y-1">
                  <Label htmlFor="document">File</Label>
                  <Input id="document" name="document" type="file" required />
                </div>
                <SubmitButton idleLabel="Upload document" pendingLabel="Uploading..." className="w-full cursor-pointer" />
              </form>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(event) => event.preventDefault()} className="text-red-700 focus:text-red-700">
                <Trash2 className="mr-2 h-4 w-4" />
                Dispose Asset
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dispose Asset</DialogTitle>
              </DialogHeader>
              <form action={disposeAssetAction} className="space-y-3">
                <input type="hidden" name="assetId" value={assetId} />
                <SetupTextField name="reason" label="Disposal reason" required />
                <SubmitButton idleLabel="Confirm disposal" pendingLabel="Processing..." className="w-full cursor-pointer bg-red-600 hover:bg-red-700" />
              </form>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
