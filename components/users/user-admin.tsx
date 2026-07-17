"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createUserAction } from "@/app/(dashboard)/users/actions";
import { USER_ROLES } from "@/constants";
import { EnumSelect } from "@/components/shared/enum-select";
import { ReferenceSelect, type ReferenceOption } from "@/components/shared/reference-selects";
import { SetupTextField } from "@/components/settings/setup-create-modal";
import { SubmitButton } from "@/components/shared/submit-button";
import { PendingForm } from "@/components/shared/pending-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function UserAdmin({ branches }: { branches: ReferenceOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer bg-[#7C3AED] hover:bg-[#6D28D9]">
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
        </DialogHeader>
        <PendingForm action={createUserAction} onSuccess={() => setOpen(false)} className="space-y-3">
          <SetupTextField name="name" label="Name" required />
          <SetupTextField name="email" label="Email" type="email" required />
          <SetupTextField name="password" label="Temporary password" type="password" required />
          <EnumSelect name="role" label="Role" labelKey="userRole" values={USER_ROLES} defaultValue={USER_ROLES.STAFF} required />
          <ReferenceSelect name="branchId" label="Branch" options={branches} />
          <SubmitButton idleLabel="Create user" pendingLabel="Creating..." className="w-full cursor-pointer" />
        </PendingForm>
      </DialogContent>
    </Dialog>
  );
}
