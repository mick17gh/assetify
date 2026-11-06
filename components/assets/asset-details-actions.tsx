"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, PencilLine, PlusCircle, RefreshCw, Upload, Calculator, AlertTriangle } from "lucide-react";
import {
  createWorkOrderAction,
  updateAssetDepreciationAction,
  updateAssetDetailsAction,
  updateAssetStatusAction,
  recommendDisposalAction,
  decideDisposalRecommendationAction,
  uploadAssetDocumentAction,
  uploadAssetPhotoAction,
} from "@/app/(dashboard)/assets/[assetId]/actions";
import { reportExceptionAction } from "@/app/(dashboard)/exceptions/actions";
import { DisposalModal } from "@/components/assets/disposal-modal";
import { ASSET_CONDITION, ASSET_STATUS, DEPRECIATION_METHOD, DOCUMENT_TYPE, EXCEPTION_TYPE } from "@/constants";
import { EnumSelect } from "@/components/shared/enum-select";
import { ReferenceSelect, type ReferenceOption } from "@/components/shared/reference-selects";
import { SetupTextField } from "@/components/settings/setup-create-modal";
import { SubmitButton } from "@/components/shared/submit-button";
import { PendingForm } from "@/components/shared/pending-form";
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
  initialManufacturer,
  initialModelName,
  initialExistingAssetNumber,
  initialStatus,
  initialCondition,
  initialCategoryId,
  initialPurchaseCost,
  categories,
  canEditCategoryAndCost,
  canApproveDisposal,
  disposalApproval,
  recommendedSalePrice,
  depreciationUsefulLifeYears,
  depreciationSalvageValue,
  depreciationMethodOverride,
}: {
  assetId: string;
  initialName: string;
  initialDescription: string;
  initialManufacturer: string;
  initialModelName: string;
  initialExistingAssetNumber: string;
  initialStatus: string;
  initialCondition: string;
  initialCategoryId: string;
  initialPurchaseCost: string;
  categories: ReferenceOption[];
  canEditCategoryAndCost: boolean;
  canApproveDisposal: boolean;
  disposalApproval: string | null;
  recommendedSalePrice: number;
  depreciationUsefulLifeYears: string;
  depreciationSalvageValue: string;
  depreciationMethodOverride: string;
}) {
  const router = useRouter();
  const [docType, setDocType] = useState<string>(DOCUMENT_TYPE.OTHER);
  const [workOrderOpen, setWorkOrderOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [depreciationOpen, setDepreciationOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [recommendOpen, setRecommendOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Dialog open={workOrderOpen} onOpenChange={setWorkOrderOpen}>
        <DialogTrigger asChild>
          <Button className="cursor-pointer bg-navy-900 hover:bg-navy-950">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Work Order
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Work Order</DialogTitle>
            <DialogDescription>Add a maintenance work order from asset details.</DialogDescription>
          </DialogHeader>
          <PendingForm
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
            successMessage="Work order created."
            onSuccess={() => {
              setWorkOrderOpen(false);
              router.refresh();
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
          </PendingForm>
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="cursor-pointer border-navy-200">
            <MoreHorizontal className="mr-2 h-4 w-4" />
            More
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
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
              <PendingForm
                action={updateAssetDetailsAction}
                successMessage="Asset updated."
                onSuccess={() => {
                  setEditOpen(false);
                  router.refresh();
                }}
                className="space-y-3"
              >
                <input type="hidden" name="assetId" value={assetId} />
                <SetupTextField name="name" label="Name" required defaultValue={initialName} />
                <SetupTextField name="manufacturer" label="Manufacturer" defaultValue={initialManufacturer} />
                <SetupTextField name="modelName" label="Model" defaultValue={initialModelName} />
                <SetupTextField name="existingAssetNumber" label="Existing asset number" defaultValue={initialExistingAssetNumber} />
                <div className="space-y-1">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" defaultValue={initialDescription} />
                </div>
                {canEditCategoryAndCost ? (
                  <>
                    <ReferenceSelect
                      name="categoryId"
                      label="Category"
                      options={categories}
                      defaultValue={initialCategoryId}
                      required
                    />
                    <SetupTextField
                      name="purchaseCost"
                      label="Purchase Cost (GHS)"
                      required
                      defaultValue={initialPurchaseCost}
                      pattern="^\d+(\.\d{1,2})?$"
                    />
                  </>
                ) : null}
                <SubmitButton idleLabel="Save changes" pendingLabel="Saving..." className="w-full cursor-pointer bg-navy-900 hover:bg-navy-950" />
              </PendingForm>
            </DialogContent>
          </Dialog>

          <Dialog open={depreciationOpen} onOpenChange={setDepreciationOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                <Calculator className="mr-2 h-4 w-4" />
                Depreciation Overrides
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Depreciation Overrides</DialogTitle>
                <DialogDescription>
                  Override category depreciation rules for this asset. Leave blank to use category defaults.
                </DialogDescription>
              </DialogHeader>
              <PendingForm
                action={updateAssetDepreciationAction}
                successMessage="Depreciation overrides saved."
                onSuccess={() => {
                  setDepreciationOpen(false);
                  router.refresh();
                }}
                className="space-y-3"
              >
                <input type="hidden" name="assetId" value={assetId} />
                <SetupTextField
                  name="depreciationUsefulLifeYears"
                  label="Useful life (years)"
                  type="number"
                  defaultValue={depreciationUsefulLifeYears}
                />
                <SetupTextField
                  name="depreciationSalvageValue"
                  label="Salvage value (GHS)"
                  defaultValue={depreciationSalvageValue}
                />
                <EnumSelect
                  name="depreciationMethodOverride"
                  label="Method"
                  labelKey="depreciationMethod"
                  values={DEPRECIATION_METHOD}
                  defaultValue={depreciationMethodOverride || DEPRECIATION_METHOD.STRAIGHT_LINE}
                />
                <SubmitButton idleLabel="Save overrides" pendingLabel="Saving..." className="w-full cursor-pointer bg-navy-900 hover:bg-navy-950" />
              </PendingForm>
            </DialogContent>
          </Dialog>

          <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
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
              <PendingForm
                action={updateAssetStatusAction}
                successMessage="Status updated."
                onSuccess={() => {
                  setStatusOpen(false);
                  router.refresh();
                }}
                className="space-y-3"
              >
                <input type="hidden" name="assetId" value={assetId} />
                <EnumSelect name="status" label="Status" labelKey="assetStatus" values={ASSET_STATUS} defaultValue={initialStatus} required />
                <EnumSelect name="condition" label="Condition" labelKey="assetCondition" values={ASSET_CONDITION} defaultValue={initialCondition} required />
                <SetupTextField name="note" label="Note" />
                <SubmitButton idleLabel="Update status" pendingLabel="Updating..." className="w-full cursor-pointer" />
              </PendingForm>
            </DialogContent>
          </Dialog>

          <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
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
              <PendingForm
                action={uploadAssetPhotoAction}
                successMessage="Photo uploaded."
                onSuccess={() => {
                  setPhotoDialogOpen(false);
                  router.refresh();
                }}
                className="space-y-3"
              >
                <input type="hidden" name="assetId" value={assetId} />
                <div className="space-y-1">
                  <Label htmlFor="photo">Photo</Label>
                  <Input id="photo" name="photo" type="file" accept="image/*" required />
                </div>
                <SubmitButton idleLabel="Upload photo" pendingLabel="Uploading..." className="w-full cursor-pointer" />
              </PendingForm>
            </DialogContent>
          </Dialog>

          <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
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
              <PendingForm
                action={uploadAssetDocumentAction}
                successMessage="Document uploaded."
                onSuccess={() => {
                  setDocumentDialogOpen(false);
                  router.refresh();
                }}
                className="space-y-3"
              >
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
                  <Label htmlFor="displayName">Document name</Label>
                  <Input id="displayName" name="displayName" placeholder="e.g. Warranty card" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="document">File</Label>
                  <Input id="document" name="document" type="file" required />
                </div>
                <SubmitButton idleLabel="Upload document" pendingLabel="Uploading..." className="w-full cursor-pointer" />
              </PendingForm>
            </DialogContent>
          </Dialog>

          <Dialog open={recommendOpen} onOpenChange={setRecommendOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                Recommend disposal
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Recommend disposal</DialogTitle>
                <DialogDescription>This marks the asset Pending Disposal. Nothing is disposed until the recommendation is approved and recorded.</DialogDescription>
              </DialogHeader>
              <PendingForm action={recommendDisposalAction} successMessage="Recommendation saved." onSuccess={() => { setRecommendOpen(false); router.refresh(); }} className="space-y-3">
                <input type="hidden" name="assetId" value={assetId} />
                <EnumSelect name="condition" label="Condition" labelKey="assetCondition" values={ASSET_CONDITION} defaultValue={initialCondition} required />
                <SetupTextField name="recommendedAction" label="Recommended action" required minLength={2} />
                <SetupTextField name="reason" label="Reason" required minLength={3} />
                <SubmitButton idleLabel="Save recommendation" pendingLabel="Saving..." className="w-full cursor-pointer" />
              </PendingForm>
            </DialogContent>
          </Dialog>
          {canApproveDisposal && disposalApproval === "PENDING" ? (
            <>
              <PendingForm action={decideDisposalRecommendationAction} successMessage="Recommendation approved.">
                <input type="hidden" name="assetId" value={assetId} />
                <input type="hidden" name="decision" value="APPROVED" />
                <SubmitButton idleLabel="Approve disposal" pendingLabel="Saving..." variant="ghost" className="w-full justify-start cursor-pointer" />
              </PendingForm>
              <PendingForm action={decideDisposalRecommendationAction} successMessage="Recommendation rejected.">
                <input type="hidden" name="assetId" value={assetId} />
                <input type="hidden" name="decision" value="REJECTED" />
                <SubmitButton idleLabel="Reject disposal" pendingLabel="Saving..." variant="ghost" className="w-full justify-start cursor-pointer" />
              </PendingForm>
            </>
          ) : null}
          <DisposalModal assetId={assetId} recommendedSalePrice={recommendedSalePrice} canRecord={disposalApproval === "APPROVED"} />
          <Dialog open={reportOpen} onOpenChange={setReportOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Report exception
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Report exception</DialogTitle>
                <DialogDescription>Open an exception for this asset.</DialogDescription>
              </DialogHeader>
              <PendingForm
                action={reportExceptionAction}
                successMessage="Exception reported."
                onSuccess={() => {
                  setReportOpen(false);
                  router.refresh();
                }}
                className="space-y-3"
              >
                <input type="hidden" name="assetId" value={assetId} />
                <EnumSelect name="type" label="Type" labelKey="exceptionType" values={EXCEPTION_TYPE} required />
                <div className="space-y-1">
                  <Label htmlFor="exception-description">Description</Label>
                  <Textarea id="exception-description" name="description" required />
                </div>
                <SetupTextField name="dueDate" label="Due date" type="date" />
                <SubmitButton idleLabel="Report exception" pendingLabel="Saving..." className="w-full cursor-pointer" />
              </PendingForm>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
