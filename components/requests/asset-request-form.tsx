"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createAssetRequestAction } from "@/app/(dashboard)/requests/actions";
import { ASSET_REQUEST_URGENCY } from "@/constants";
import { EnumSelect } from "@/components/shared/enum-select";
import { UserLookupSelect } from "@/components/shared/entity-lookups";
import { ReferenceSelect, type ReferenceOption } from "@/components/shared/reference-selects";
import { AssetNameLookup } from "@/components/requests/asset-name-lookup";
import { SubmitButton } from "@/components/shared/submit-button";
import { PendingForm } from "@/components/shared/pending-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PickerOption } from "@/lib/lookups/types";

type SeedAsset = { id: string; name: string; categoryId: string };

export function AssetRequestForm({
  categories,
  departments,
  assetSeed,
  custodianSeed,
}: {
  categories: ReferenceOption[];
  departments: ReferenceOption[];
  assetSeed: SeedAsset[];
  custodianSeed: PickerOption[];
}) {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [assetName, setAssetName] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer bg-navy-900 hover:bg-navy-950">
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit Asset Request</DialogTitle>
        </DialogHeader>
        <PendingForm
          action={createAssetRequestAction}
          onSuccess={() => {
            setOpen(false);
            setCategoryId("");
            setAssetName("");
          }}
          successMessage="Asset request submitted."
          className="flex min-h-0 min-w-0 flex-1 flex-col"
        >
          <DialogBody className="grid min-w-0 gap-3 pb-2 sm:grid-cols-2">
            <div className="min-w-0 sm:col-span-2">
              <ReferenceSelect
                name="categoryId"
                label="Category"
                options={categories}
                value={categoryId}
                onValueChange={(value) => {
                  setCategoryId(value);
                  setAssetName("");
                }}
                required
              />
            </div>
            <div className="min-w-0 sm:col-span-2">
              <AssetNameLookup
                categoryId={categoryId}
                seedAssets={assetSeed}
                value={assetName}
                onValueChange={setAssetName}
              />
            </div>
            <div className="min-w-0 sm:col-span-2">
              <UserLookupSelect name="custodianId" label="Custodian" seed={custodianSeed} allowNone />
            </div>
            <ReferenceSelect name="departmentId" label="Department" options={departments} />
            <EnumSelect
              name="urgency"
              label="Urgency"
              labelKey="assetRequestUrgency"
              values={ASSET_REQUEST_URGENCY}
              defaultValue={ASSET_REQUEST_URGENCY.MEDIUM}
              required
            />
            <div className="min-w-0 space-y-1 sm:col-span-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                name="reason"
                required
                minLength={3}
                maxLength={1000}
                placeholder="Why do you need this asset?"
              />
            </div>
            <div className="min-w-0 space-y-1 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" maxLength={2000} placeholder="Additional details (optional)" />
            </div>
          </DialogBody>
          <DialogFooter>
            <SubmitButton
              idleLabel="Submit request"
              pendingLabel="Submitting..."
              className="w-full cursor-pointer bg-navy-900 hover:bg-navy-950 sm:w-auto"
            />
          </DialogFooter>
        </PendingForm>
      </DialogContent>
    </Dialog>
  );
}
