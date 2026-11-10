"use client";

import { useState } from "react";
import { recordAssetDisposalAction } from "@/app/(dashboard)/assets/[assetId]/actions";
import { DISPOSAL_METHOD } from "@/constants";
import { EnumSelect } from "@/components/shared/enum-select";
import { SetupTextField } from "@/components/settings/setup-create-modal";
import { SubmitButton } from "@/components/shared/submit-button";
import { PendingForm } from "@/components/shared/pending-form";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DisposalModal({
  assetId,
  recommendedSalePrice,
  canRecord,
}: {
  assetId: string;
  recommendedSalePrice: number;
  canRecord: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<string>(DISPOSAL_METHOD.DISPOSED);

  if (!canRecord) {
    return (
      <DropdownMenuItem disabled className="text-red-700 focus:text-red-700">
        <Trash2 className="mr-2 h-4 w-4" />
        Record Disposal
      </DropdownMenuItem>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(event) => event.preventDefault()} className="text-red-700 focus:text-red-700">
          <Trash2 className="mr-2 h-4 w-4" />
          Record Disposal
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Asset Disposal</DialogTitle>
        </DialogHeader>
        <PendingForm
          action={recordAssetDisposalAction}
          onSuccess={() => setOpen(false)}
          successMessage="Asset disposal recorded."
          className="flex min-h-0 flex-1 flex-col"
        >
          <input type="hidden" name="assetId" value={assetId} />
          <DialogBody className="space-y-3 pb-2">
            <EnumSelect
              name="method"
              label="Disposal method"
              labelKey="disposalMethod"
              values={DISPOSAL_METHOD}
              value={method}
              onValueChange={setMethod}
              required
            />
            <SetupTextField name="disposalDate" label="Disposal date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
            <SetupTextField name="reason" label="Reason" required />
            <div className="space-y-1">
              <Label htmlFor="evidence">Evidence</Label>
              <Input id="evidence" name="evidence" type="file" />
            </div>
            {method === DISPOSAL_METHOD.SOLD ? (
              <>
                <p className="text-sm text-navy-900/70">
                  Recommended sale price: <strong>GHS {recommendedSalePrice.toLocaleString()}</strong>
                </p>
                <SetupTextField
                  name="salePrice"
                  label="Sale price (GHS)"
                  required
                  defaultValue={recommendedSalePrice.toFixed(2)}
                />
                <SetupTextField name="buyerName" label="Buyer name" required />
                <SetupTextField name="buyerContact" label="Buyer contact" />
              </>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <SubmitButton
              idleLabel="Confirm disposal"
              pendingLabel="Processing..."
              className="w-full cursor-pointer bg-red-600 hover:bg-red-700 sm:w-auto"
            />
          </DialogFooter>
        </PendingForm>
      </DialogContent>
    </Dialog>
  );
}
