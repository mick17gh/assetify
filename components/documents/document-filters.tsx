"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DOCUMENT_TYPE, ENUM_LABELS } from "@/constants";
import type { ReferenceOption } from "@/components/shared/reference-selects";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getQueryNavigationTarget } from "@/lib/filters/query";

export function DocumentFilters({
  branches,
  assets,
}: {
  branches: ReferenceOption[];
  assets: ReferenceOption[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const type = params.get("type") ?? "ALL";
  const asset = params.get("asset") ?? "ALL";
  const branch = params.get("branch") ?? "ALL";
  const typeLabels = ENUM_LABELS.documentType;

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
      <Select
        value={type}
        onValueChange={(value) => {
          updateQuery((next) => {
            if (value === "ALL") next.delete("type");
            else next.set("type", value);
          });
        }}
      >
        <SelectTrigger className="h-9 w-[180px] cursor-pointer border-purple-200">
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
      <Select
        value={asset}
        onValueChange={(value) => {
          updateQuery((next) => {
            if (value === "ALL") next.delete("asset");
            else next.set("asset", value);
          });
        }}
      >
        <SelectTrigger className="h-9 w-[200px] cursor-pointer border-purple-200">
          <SelectValue placeholder="All assets" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All assets</SelectItem>
          {assets.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
    </>
  );
}
