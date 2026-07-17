"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createAssetRequestAction } from "@/app/(dashboard)/requests/actions";
import { ASSET_REQUEST_URGENCY } from "@/constants";
import { EnumSelect } from "@/components/shared/enum-select";
import { ReferenceSelect, type ReferenceOption } from "@/components/shared/reference-selects";
import { SubmitButton } from "@/components/shared/submit-button";
import { PendingForm } from "@/components/shared/pending-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function AssetRequestForm({
  categories,
  departments,
}: {
  categories: ReferenceOption[];
  departments: ReferenceOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer bg-[#7C3AED] hover:bg-[#6D28D9]">
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
          onSuccess={() => setOpen(false)}
          successMessage="Asset request submitted."
          className="grid gap-3 sm:grid-cols-2"
        >
          <ReferenceSelect name="categoryId" label="Asset type" options={categories} required />
          <ReferenceSelect name="departmentId" label="Department" options={departments} />
          <div className="sm:col-span-2">
            <EnumSelect
              name="urgency"
              label="Urgency"
              labelKey="assetRequestUrgency"
              values={ASSET_REQUEST_URGENCY}
              defaultValue={ASSET_REQUEST_URGENCY.MEDIUM}
              required
            />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <Label htmlFor="reason">Reason</Label>
            <Textarea id="reason" name="reason" required placeholder="Why do you need this asset?" />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" placeholder="Additional details (optional)" />
          </div>
          <div className="sm:col-span-2">
            <SubmitButton
              idleLabel="Submit request"
              pendingLabel="Submitting..."
              className="w-full cursor-pointer bg-[#7C3AED] hover:bg-[#6D28D9]"
            />
          </div>
        </PendingForm>
      </DialogContent>
    </Dialog>
  );
}
