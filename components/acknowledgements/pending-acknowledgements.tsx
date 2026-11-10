"use client";

import { useState } from "react";
import Link from "next/link";
import { acceptAssignmentAcknowledgementAction } from "@/app/(dashboard)/acknowledgements/actions";
import { ACKNOWLEDGEMENT_METHOD } from "@/constants";
import { EnumSelect } from "@/components/shared/enum-select";
import { SetupTextField } from "@/components/settings/setup-create-modal";
import { PendingForm } from "@/components/shared/pending-form";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PendingRow = {
  id: string;
  createdAt: string;
  asset: { id: string; ain: string; name: string; serialNumber: string };
};

export function PendingAcknowledgements({ rows }: { rows: PendingRow[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [method, setMethod] = useState<string>(ACKNOWLEDGEMENT_METHOD.CHECKBOX);
  const active = rows.find((row) => row.id === activeId) ?? null;

  if (rows.length === 0) {
    return (
      <Card className="border-navy-200 shadow-sm">
        <CardContent className="py-8 text-sm text-navy-900/70">No pending custody acknowledgements.</CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {rows.map((row) => (
          <Card key={row.id} className="border-navy-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-navy-950">{row.asset.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="text-navy-900/75">
                <p>
                  {row.asset.ain} · SN {row.asset.serialNumber}
                </p>
                <p className="text-xs text-navy-900/55">Assigned {row.createdAt}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild className="cursor-pointer border-navy-200">
                  <Link href={`/assets/${row.asset.id}`} prefetch>
                    View asset
                  </Link>
                </Button>
                <Button
                  className="cursor-pointer bg-navy-900 hover:bg-navy-950"
                  onClick={() => {
                    setMethod(ACKNOWLEDGEMENT_METHOD.CHECKBOX);
                    setActiveId(row.id);
                  }}
                >
                  Accept custody
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(active)} onOpenChange={(open) => !open && setActiveId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept custody</DialogTitle>
          </DialogHeader>
          {active ? (
            <PendingForm
              action={acceptAssignmentAcknowledgementAction}
              successMessage="Custody accepted."
              onSuccess={() => setActiveId(null)}
              className="flex min-h-0 flex-1 flex-col"
            >
              <DialogBody className="space-y-3 pb-2">
                <input type="hidden" name="acknowledgementId" value={active.id} />
                <p className="text-sm text-navy-900/75">
                  Confirm you accept custody of <strong>{active.asset.name}</strong> ({active.asset.ain}).
                </p>
                <EnumSelect
                  name="method"
                  label="Acceptance method"
                  labelKey="acknowledgementMethod"
                  values={ACKNOWLEDGEMENT_METHOD}
                  value={method}
                  onValueChange={setMethod}
                  required
                />
                {method === ACKNOWLEDGEMENT_METHOD.CHECKBOX ? (
                  <label className="flex items-center gap-2 text-sm text-navy-900">
                    <input type="checkbox" name="acknowledgementAccepted" value="true" required className="h-4 w-4" />
                    I accept custody of this asset
                  </label>
                ) : null}
                {method === ACKNOWLEDGEMENT_METHOD.PIN ? (
                  <SetupTextField name="acknowledgementPin" label="PIN" required minLength={4} type="password" />
                ) : null}
                {method === ACKNOWLEDGEMENT_METHOD.SIGNATURE ? (
                  <SetupTextField name="acknowledgementNote" label="Signature name" required minLength={2} />
                ) : null}
              </DialogBody>
              <DialogFooter>
                <SubmitButton
                  idleLabel="Accept"
                  pendingLabel="Saving..."
                  className="w-full cursor-pointer bg-navy-900 hover:bg-navy-950 sm:w-auto"
                />
              </DialogFooter>
            </PendingForm>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
