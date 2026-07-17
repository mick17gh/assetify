"use client";

import { useState } from "react";
import { recordAssetDisposalAction } from "@/app/(dashboard)/assets/[assetId]/actions";
import { DISPOSAL_METHOD } from "@/constants";
import { EnumSelect } from "@/components/shared/enum-select";
import { SetupTextField } from "@/components/settings/setup-create-modal";
import { SubmitButton } from "@/components/shared/submit-button";
import { PendingForm } from "@/components/shared/pending-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Trash2 } from "lucide-react";

export function DisposalModal({
  assetId,
  recommendedSalePrice,
}: {
  assetId: string;
  recommendedSalePrice: number;
}) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<string>(DISPOSAL_METHOD.DISPOSED);

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
          className="space-y-3"
        >
          <input type="hidden" name="assetId" value={assetId} />
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
          {method === DISPOSAL_METHOD.SOLD ? (
            <>
              <p className="text-sm text-purple-900/70">
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
          <SubmitButton idleLabel="Confirm disposal" pendingLabel="Processing..." className="w-full cursor-pointer bg-red-600 hover:bg-red-700" />
        </PendingForm>
      </DialogContent>
    </Dialog>
  );
}
