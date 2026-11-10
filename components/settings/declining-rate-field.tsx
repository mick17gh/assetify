"use client";

import { useState } from "react";
import { EnumSelect } from "@/components/shared/enum-select";
import { SetupTextField } from "@/components/settings/setup-create-modal";
import { DEPRECIATION_METHOD } from "@/constants";

export function DepreciationMethodFields({
  defaultMethod = DEPRECIATION_METHOD.STRAIGHT_LINE,
  defaultUsefulLife = "5",
  defaultSalvage = "10",
  defaultDecliningRate = "40",
}: {
  defaultMethod?: string;
  defaultUsefulLife?: string;
  defaultSalvage?: string;
  defaultDecliningRate?: string;
}) {
  const [method, setMethod] = useState(defaultMethod);

  return (
    <>
      <EnumSelect
        name="method"
        label="Method"
        labelKey="depreciationMethod"
        values={DEPRECIATION_METHOD}
        defaultValue={defaultMethod}
        value={method}
        onValueChange={setMethod}
        required
      />
      <SetupTextField
        name="usefulLifeYears"
        label="Useful life (years)"
        type="number"
        required
        defaultValue={defaultUsefulLife}
      />
      <SetupTextField name="salvagePercent" label="Salvage %" type="number" required defaultValue={defaultSalvage} />
      {method === DEPRECIATION_METHOD.DECLINING_BALANCE ? (
        <SetupTextField
          name="decliningRatePercent"
          label="Declining rate %"
          type="number"
          defaultValue={defaultDecliningRate}
        />
      ) : (
        <input type="hidden" name="decliningRatePercent" value="" />
      )}
    </>
  );
}
