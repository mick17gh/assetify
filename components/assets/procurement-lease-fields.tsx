"use client";

import { useState } from "react";
import { EnumSelect } from "@/components/shared/enum-select";
import { SetupTextField } from "@/components/settings/setup-create-modal";
import { OWNERSHIP_TYPE } from "@/constants";

export function ProcurementLeaseFields({
  defaults,
}: {
  defaults?: {
    poNumber?: string;
    invoiceNumber?: string;
    invoiceUrl?: string;
    capitalizedDate?: string;
    ownershipType?: string;
    lessorName?: string;
    leaseStartDate?: string;
    leaseEndDate?: string;
    leaseMonthlyCost?: string;
  };
}) {
  const [ownership, setOwnership] = useState(defaults?.ownershipType || OWNERSHIP_TYPE.OWNED);
  const leased = ownership === OWNERSHIP_TYPE.LEASED || ownership === OWNERSHIP_TYPE.RENTED;

  return (
    <>
      <SetupTextField name="poNumber" label="PO number" defaultValue={defaults?.poNumber} />
      <SetupTextField name="invoiceNumber" label="Invoice number" defaultValue={defaults?.invoiceNumber} />
      <SetupTextField name="invoiceUrl" label="Invoice / receipt URL" defaultValue={defaults?.invoiceUrl} />
      <SetupTextField
        name="capitalizedDate"
        label="Capitalized date"
        type="date"
        defaultValue={defaults?.capitalizedDate}
      />
      <EnumSelect
        name="ownershipType"
        label="Ownership"
        labelKey="ownershipType"
        values={OWNERSHIP_TYPE}
        value={ownership}
        onValueChange={setOwnership}
      />
      {leased ? (
        <>
          <SetupTextField name="lessorName" label="Lessor / rental company" required defaultValue={defaults?.lessorName} />
          <SetupTextField name="leaseStartDate" label="Lease start" type="date" defaultValue={defaults?.leaseStartDate} />
          <SetupTextField name="leaseEndDate" label="Lease end" type="date" defaultValue={defaults?.leaseEndDate} />
          <SetupTextField
            name="leaseMonthlyCost"
            label="Monthly cost"
            pattern="^\d+(\.\d{1,2})?$"
            defaultValue={defaults?.leaseMonthlyCost}
          />
        </>
      ) : null}
    </>
  );
}
