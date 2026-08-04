"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { RECOMMENDATION_STATE } from "@/constants";
import { EnumSelectFilter } from "@/components/shared/enum-select";
import { getQueryNavigationTarget } from "@/lib/filters/query";
import { clearPaginationParams } from "@/lib/pagination/page";

export function RecommendationStateFilter({
  paramName = "state",
}: {
  paramName?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const selected = params.get(paramName) ?? "ALL";

  return (
    <EnumSelectFilter
      name={paramName}
      label="State"
      labelKey="recommendationState"
      values={RECOMMENDATION_STATE}
      value={selected}
      onValueChange={(value) => {
        const target = getQueryNavigationTarget(params, (next) => {
          clearPaginationParams(next);
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
