"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { assignOfficerAction } from "@/app/(dashboard)/campaigns/actions";
import { OptionalReferenceSelect, ReferenceSelect, type ReferenceOption } from "@/components/shared/reference-selects";
import { PendingForm } from "@/components/shared/pending-form";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function AssignOfficerDialog({
  campaignId,
  officers,
  branches,
}: {
  campaignId: string;
  officers: ReferenceOption[];
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
          className="space-y-3"
        >
          <input type="hidden" name="campaignId" value={campaignId} />
          <ReferenceSelect name="userId" label="Officer" options={officers} required />
          <OptionalReferenceSelect name="branchId" label="Branch" options={branches} />
          <SubmitButton idleLabel="Assign" pendingLabel="Assigning..." className="w-full cursor-pointer bg-navy-900 hover:bg-navy-950" />
        </PendingForm>
      </DialogContent>
    </Dialog>
  );
}
