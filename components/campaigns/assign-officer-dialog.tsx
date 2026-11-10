"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { assignOfficerAction } from "@/app/(dashboard)/campaigns/actions";
import { UserLookupSelect } from "@/components/shared/entity-lookups";
import { OptionalReferenceSelect, type ReferenceOption } from "@/components/shared/reference-selects";
import { PendingForm } from "@/components/shared/pending-form";
import { SubmitButton } from "@/components/shared/submit-button";
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
import type { PickerOption } from "@/lib/lookups/types";

export function AssignOfficerDialog({
  campaignId,
  officerSeed,
  branches,
}: {
  campaignId: string;
  officerSeed: PickerOption[];
  branches: ReferenceOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer bg-navy-900 hover:bg-navy-950">
          <UserPlus className="mr-2 h-4 w-4" />
          Assign officer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign officer</DialogTitle>
          <DialogDescription>Leave the branch empty to cover every branch in this campaign.</DialogDescription>
        </DialogHeader>
        <PendingForm
          action={assignOfficerAction}
          successMessage="Officer assigned."
          onSuccess={() => setOpen(false)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <DialogBody className="space-y-3 pb-2">
            <input type="hidden" name="campaignId" value={campaignId} />
            <UserLookupSelect name="userId" label="Officer" seed={officerSeed} required />
            <OptionalReferenceSelect name="branchId" label="Branch" options={branches} />
          </DialogBody>
          <DialogFooter>
            <SubmitButton
              idleLabel="Assign"
              pendingLabel="Assigning..."
              className="w-full cursor-pointer bg-navy-900 hover:bg-navy-950 sm:w-auto"
            />
          </DialogFooter>
        </PendingForm>
      </DialogContent>
    </Dialog>
  );
}
