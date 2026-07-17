"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ASSET_REQUEST_STATUS, ASSET_REQUEST_URGENCY } from "@/constants";
import { EnumSelectFilter } from "@/components/shared/enum-select";
import type { ReferenceOption } from "@/components/shared/reference-selects";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getQueryNavigationTarget } from "@/lib/filters/query";

export function AssetRequestFilters({
  branches,
  showBranchFilter = false,
}: {
  branches?: ReferenceOption[];
  showBranchFilter?: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const status = params.get("status") ?? "ALL";
  const urgency = params.get("urgency") ?? "ALL";
  const branch = params.get("branch") ?? "ALL";

  function updateQuery(mutate: (next: URLSearchParams) => void) {
    const target = getQueryNavigationTarget(params, (next) => {
      next.delete("cursor");
      next.delete("stack");
      mutate(next);
    });
    if (!target) return;
    router.replace(target);
  }

  return (
    <>
      {showBranchFilter && branches?.length ? (
        <Select
          value={branch}
          onValueChange={(value) => {
            updateQuery((next) => {
              if (value === "ALL") next.delete("branch");
              else next.set("branch", value);
            });
          }}
        >
          <SelectTrigger className="h-9 w-[180px] cursor-pointer border-purple-200">
            <SelectValue placeholder="All branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All branches</SelectItem>
            {branches.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      <EnumSelectFilter
        name="status"
        label="Status"
        labelKey="assetRequestStatus"
        values={ASSET_REQUEST_STATUS}
        value={status}
        onValueChange={(value) => {
          updateQuery((next) => {
            if (value === "ALL") next.delete("status");
            else next.set("status", value);
          });
        }}
      />
      <EnumSelectFilter
        name="urgency"
        label="Urgency"
        labelKey="assetRequestUrgency"
        values={ASSET_REQUEST_URGENCY}
        value={urgency}
        onValueChange={(value) => {
          updateQuery((next) => {
            if (value === "ALL") next.delete("urgency");
            else next.set("urgency", value);
          });
        }}
      />
    </>
  );
}
