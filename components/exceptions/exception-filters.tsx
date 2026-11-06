"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ENUM_LABELS, EXCEPTION_STATUS, EXCEPTION_TYPE } from "@/constants";
import { EnumSelectFilter } from "@/components/shared/enum-select";
import { InlineCombobox, type ReferenceOption } from "@/components/shared/reference-selects";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getQueryNavigationTarget } from "@/lib/filters/query";
import { clearPaginationParams } from "@/lib/pagination/page";

export function ExceptionFilters({ assignees }: { assignees: ReferenceOption[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const type = params.get("type") ?? "ALL";
  const status = params.get("status") ?? "OPEN";
  const assignee = params.get("assignee") ?? "";

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
      <EnumSelectFilter
        name="type"
        label="Type"
        labelKey="exceptionType"
        values={EXCEPTION_TYPE}
        value={type}
        onValueChange={(value) => {
          updateQuery((next) => {
            if (value === "ALL") next.delete("type");
            else next.set("type", value);
          });
        }}
      />
      <Select
        value={status}
        onValueChange={(value) => {
          updateQuery((next) => {
            if (value === "OPEN") next.delete("status");
            else next.set("status", value);
          });
        }}
      >
        <SelectTrigger className="h-9 w-full min-w-0 cursor-pointer border-navy-200 sm:w-[160px]">
          <SelectValue placeholder="Open" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="OPEN">Open</SelectItem>
          <SelectItem value="ALL">All</SelectItem>
          {Object.values(EXCEPTION_STATUS).map((value) => (
            <SelectItem key={value} value={value}>
              {ENUM_LABELS.exceptionStatus[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <InlineCombobox
        value={assignee}
        options={assignees}
        allowNone
        placeholder="All assignees"
        onValueChange={(value) => {
          updateQuery((next) => {
            if (!value) next.delete("assignee");
            else next.set("assignee", value);
          });
        }}
        className="h-9 w-full sm:w-[180px]"
      />
    </>
  );
}
