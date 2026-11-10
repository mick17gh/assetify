"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DOCUMENT_TYPE, ENUM_LABELS } from "@/constants";
import { AssetLookupPicker } from "@/components/shared/entity-lookups";
import { InlineCombobox, type ReferenceOption } from "@/components/shared/reference-selects";
import type { PickerOption } from "@/lib/lookups/types";
import { getQueryNavigationTarget } from "@/lib/filters/query";
import { clearPaginationParams } from "@/lib/pagination/page";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DocumentFilters({
  branches,
  assetSeed,
}: {
  branches: ReferenceOption[];
  assetSeed: PickerOption[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const type = params.get("type") ?? "ALL";
  const asset = params.get("asset") ?? "";
  const branch = params.get("branch") ?? "";
  const typeLabels = ENUM_LABELS.documentType;

  function updateQuery(mutate: (next: URLSearchParams) => void) {
    const target = getQueryNavigationTarget(params, (next) => {
      clearPaginationParams(next);
      mutate(next);
    });
    if (!target) return;
    router.replace(target);
  }

  return (
    <>
      <Select
        value={type}
        onValueChange={(value) => {
          updateQuery((next) => {
            if (value === "ALL") next.delete("type");
            else next.set("type", value);
          });
        }}
      >
        <SelectTrigger className="h-9 w-full min-w-0 cursor-pointer border-navy-200 sm:w-[180px]">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All types</SelectItem>
          {Object.values(DOCUMENT_TYPE).map((entry) => (
            <SelectItem key={entry} value={entry}>
              {typeLabels[entry] ?? entry}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <AssetLookupPicker
        value={asset}
        seed={assetSeed}
        allowNone
        noneLabel="All assets"
        placeholder="All assets"
        className="h-9 w-full sm:w-[220px]"
        onValueChange={(value) => {
          updateQuery((next) => {
            if (!value) next.delete("asset");
            else next.set("asset", value);
          });
        }}
      />
      <InlineCombobox
        value={branch}
        options={branches}
        allowNone
        placeholder="All branches"
        className="h-9 w-full sm:w-[180px]"
        onValueChange={(value) => {
          updateQuery((next) => {
            if (!value) next.delete("branch");
            else next.set("branch", value);
          });
        }}
      />
    </>
  );
}
