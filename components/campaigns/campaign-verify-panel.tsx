"use client";

import { useState } from "react";
import { EXCEPTION_TYPE, NOT_FOUND_REASON, VERIFICATION_OUTCOME } from "@/constants";
import { verifyAssetAction } from "@/app/(dashboard)/campaigns/actions";
import { EnumSelect } from "@/components/shared/enum-select";
import { ReferenceSelect, type ReferenceOption } from "@/components/shared/reference-selects";
import { SetupTextField } from "@/components/settings/setup-create-modal";
import { PendingForm } from "@/components/shared/pending-form";
import { SubmitButton } from "@/components/shared/submit-button";
import { pageActionGroupClass } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CampaignVerifyPanel({
  campaignId,
  campaignName,
  assetId,
  branches = [],
  categories = [],
}: {
  campaignId: string;
  campaignName: string;
  assetId?: string;
  branches?: ReferenceOption[];
  categories?: ReferenceOption[];
}) {
  const [open, setOpen] = useState(false);
  const [notFoundOpen, setNotFoundOpen] = useState(false);
  const [notFoundReason, setNotFoundReason] = useState("");

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-navy-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-navy-900">Verification campaign</p>
        <p className="mt-1 text-sm text-navy-900/70">
          {assetId
            ? `${campaignName} includes this asset. Record what you found. This does not replace a movement.`
            : `${campaignName} is active. Record an asset that is not in the register.`}
        </p>
      </div>
      <div className={pageActionGroupClass}>
        {assetId ? (
          <>
            <PendingForm action={verifyAssetAction} successMessage="Verification recorded.">
              <input type="hidden" name="campaignId" value={campaignId} />
              <input type="hidden" name="assetId" value={assetId} />
              <input type="hidden" name="outcome" value={VERIFICATION_OUTCOME.VERIFIED} />
              <SubmitButton idleLabel="Yes, verified" pendingLabel="Saving..." className="cursor-pointer bg-navy-900 hover:bg-navy-950" />
            </PendingForm>
            <Dialog open={notFoundOpen} onOpenChange={setNotFoundOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="cursor-pointer border-navy-200">
                  Not found
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Asset not found</DialogTitle>
                  <DialogDescription>A reason is required. Other also needs a note.</DialogDescription>
                </DialogHeader>
                <PendingForm
                  action={verifyAssetAction}
                  successMessage="Verification recorded."
                  onSuccess={() => setNotFoundOpen(false)}
                  className="flex min-h-0 flex-1 flex-col"
                >
                  <DialogBody className="space-y-3 pb-2">
                    <input type="hidden" name="campaignId" value={campaignId} />
                    <input type="hidden" name="assetId" value={assetId} />
                    <input type="hidden" name="outcome" value={VERIFICATION_OUTCOME.NOT_FOUND} />
                    <EnumSelect
                      name="notFoundReason"
                      label="Reason"
                      labelKey="notFoundReason"
                      values={NOT_FOUND_REASON}
                      value={notFoundReason}
                      onValueChange={setNotFoundReason}
                      required
                    />
                    <div className="space-y-1">
                      <Label htmlFor={`last-known-${campaignId}`}>Last known location</Label>
                      <Input id={`last-known-${campaignId}`} name="lastKnownLocation" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`not-found-note-${campaignId}`}>Note</Label>
                      <Textarea id={`not-found-note-${campaignId}`} name="notes" required={notFoundReason === NOT_FOUND_REASON.OTHER} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`not-found-photo-${campaignId}`}>Photo</Label>
                      <Input id={`not-found-photo-${campaignId}`} name="photo" type="file" accept="image/*" />
                    </div>
                  </DialogBody>
                  <DialogFooter>
                    <SubmitButton idleLabel="Record not found" pendingLabel="Saving..." className="w-full cursor-pointer sm:w-auto" />
                  </DialogFooter>
                </PendingForm>
              </DialogContent>
            </Dialog>
          </>
        ) : null}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="cursor-pointer border-navy-200">
              {assetId ? "Exception" : "Record unregistered find"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{assetId ? "Record exception" : "Unregistered find"}</DialogTitle>
              <DialogDescription>
                {assetId
                  ? "Choose the type of mismatch for this asset."
                  : "Create the asset, record it as unregistered, and open one exception."}
              </DialogDescription>
            </DialogHeader>
            <PendingForm
              action={verifyAssetAction}
              successMessage="Verification recorded."
              onSuccess={() => setOpen(false)}
              className="flex min-h-0 flex-1 flex-col"
            >
              <DialogBody className="space-y-3 pb-2">
                <input type="hidden" name="campaignId" value={campaignId} />
                {assetId ? <input type="hidden" name="assetId" value={assetId} /> : null}
                <input type="hidden" name="outcome" value={assetId ? VERIFICATION_OUTCOME.EXCEPTION : VERIFICATION_OUTCOME.UNREGISTERED} />
                {assetId ? (
                  <EnumSelect name="exceptionType" label="Exception type" labelKey="exceptionType" values={EXCEPTION_TYPE} required />
                ) : (
                  <>
                    <SetupTextField name="ain" label="AIN" required pattern="[A-Za-z0-9-]{4,32}" />
                    <SetupTextField name="name" label="Asset name" required minLength={2} />
                    <SetupTextField name="serialNumber" label="Serial number" required pattern="[A-Za-z0-9-]{4,50}" />
                    <ReferenceSelect name="branchId" label="Branch" options={branches} required />
                    <ReferenceSelect name="categoryId" label="Category" options={categories} required />
                    <SetupTextField name="manufacturer" label="Manufacturer" />
                    <SetupTextField name="modelName" label="Model" />
                    <SetupTextField name="existingAssetNumber" label="Existing asset number" />
                  </>
                )}
                <div className="space-y-1">
                  <Label htmlFor={`notes-${campaignId}`}>Notes</Label>
                  <Textarea id={`notes-${campaignId}`} name="notes" placeholder="Optional note" />
                </div>
              </DialogBody>
              <DialogFooter>
                <SubmitButton
                  idleLabel="Save"
                  pendingLabel="Saving..."
                  className="w-full cursor-pointer bg-navy-900 hover:bg-navy-950 sm:w-auto"
                />
              </DialogFooter>
            </PendingForm>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
