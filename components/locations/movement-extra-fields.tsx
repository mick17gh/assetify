"use client";

import { useState } from "react";
import { EnumSelect } from "@/components/shared/enum-select";
import { SetupTextField } from "@/components/settings/setup-create-modal";
import { Label } from "@/components/ui/label";
import { ACKNOWLEDGEMENT_METHOD, ASSIGNMENT_TYPE, MOVEMENT_TYPE, TRANSFER_REASON } from "@/constants";

export function MovementExtraFields({ movementType }: { movementType: string }) {
  const [method, setMethod] = useState("");
  const staff = movementType === MOVEMENT_TYPE.STAFF_ASSIGNMENT;

  return (
    <>
      <EnumSelect name="transferReason" label="Transfer reason" labelKey="transferReason" values={TRANSFER_REASON} required />
      {staff ? (
        <>
          <EnumSelect name="assignmentType" label="Assignment type" labelKey="assignmentType" values={ASSIGNMENT_TYPE} required />
          <SetupTextField name="expectedReturnDate" label="Expected return" type="date" />
          <EnumSelect
            name="acknowledgementMethod"
            label="Assignee acknowledgement"
            labelKey="acknowledgementMethod"
            values={ACKNOWLEDGEMENT_METHOD}
            value={method}
            onValueChange={setMethod}
            required
          />
          {method === ACKNOWLEDGEMENT_METHOD.CHECKBOX ? (
            <label className="flex items-center gap-2 text-sm text-navy-900">
              <input type="checkbox" name="acknowledgementAccepted" value="true" required className="h-4 w-4" />
              Assignee accepts custody
            </label>
          ) : null}
          {method === ACKNOWLEDGEMENT_METHOD.PIN ? (
            <SetupTextField name="acknowledgementPin" label="Assignee PIN" required minLength={4} type="password" />
          ) : null}
          {method === ACKNOWLEDGEMENT_METHOD.SIGNATURE ? (
            <SetupTextField name="acknowledgementNote" label="Signature name" required minLength={2} />
          ) : null}
          {!method ? <Label className="text-xs text-navy-900/60">The assignee must accept before this assignment is saved.</Label> : null}
        </>
      ) : null}
    </>
  );
}
