"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MAINTENANCE_STATUS } from "@/constants";
import { EnumSelectFilter } from "@/components/shared/enum-select";
import { getQueryNavigationTarget } from "@/lib/filters/query";

export function MaintenanceStatusFilter({
  paramName = "status",
}: {
  paramName?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const selected = params.get(paramName) ?? "ALL";

  return (
    <EnumSelectFilter
      name={paramName}
      label="Status"
      labelKey="maintenanceStatus"
      values={MAINTENANCE_STATUS}
      value={selected}
      onValueChange={(value) => {
        const target = getQueryNavigationTarget(params, (next) => {
          next.delete("cursor");
          next.delete("stack");
          if (value === "ALL") {
            next.delete(paramName);
          } else {
            next.set(paramName, value);
          }
        });
        if (!target) return;
        router.replace(target);
      }}
    />
  );
}
