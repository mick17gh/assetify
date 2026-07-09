"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { TableSearch } from "@/components/shared/table-search";
import { getQueryNavigationTarget } from "@/lib/filters/query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE_OPTIONS = ["10", "20", "50", "100"] as const;

export function TableToolbar({
  searchPlaceholder,
  defaultLimit,
  filters,
}: {
  searchPlaceholder: string;
  defaultLimit: number;
  filters?: React.ReactNode;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const limit = params.get("limit") ?? String(defaultLimit);

  return (
    <div className="mb-4 flex flex-col gap-3 border-b border-purple-100 pb-4 md:flex-row md:items-center md:justify-between">
      <TableSearch placeholder={searchPlaceholder} />
      <div className="flex flex-wrap items-center gap-2">
        {filters}
        <span className="text-xs font-medium text-purple-900/65">Rows</span>
        <Select
          value={limit}
          onValueChange={(value) => {
            const target = getQueryNavigationTarget(params, (next) => {
              next.set("limit", value);
              next.delete("cursor");
              next.delete("stack");
            });
            if (!target) return;
            router.replace(target);
          }}
        >
          <SelectTrigger className="h-9 w-[110px] rounded-lg border-purple-200 bg-white">
            <SelectValue placeholder="Rows" />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option} rows
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
