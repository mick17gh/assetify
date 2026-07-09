"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ASSET_STATUS } from "@/constants";
import { EnumSelectFilter } from "@/components/shared/enum-select";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ReferenceOption } from "@/components/shared/reference-selects";
import { getQueryNavigationTarget } from "@/lib/filters/query";

export function AssetFilters({ branches }: { branches: ReferenceOption[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const branch = params.get("branch") ?? "ALL";
  const status = params.get("status") ?? "ALL";

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
      <div className="space-y-1">
        {/* <Label htmlFor="branch-filter">Branch</Label> */}
        <Select
          value={branch}
          onValueChange={(value) => {
            updateQuery((next) => {
              if (value === "ALL") next.delete("branch");
              else next.set("branch", value);
            });
          }}
        >
          <SelectTrigger id="branch-filter" className="h-9 w-[180px] cursor-pointer border-purple-200">
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
      </div>
      <EnumSelectFilter
        name="status"
        label="Status"
        labelKey="assetStatus"
        values={ASSET_STATUS}
        value={status}
        onValueChange={(value) => {
          updateQuery((next) => {
            if (value === "ALL") next.delete("status");
            else next.set("status", value);
          });
        }}
      />
    </>
  );
}
