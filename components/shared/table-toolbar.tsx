"use client";

import { TableSearch } from "@/components/shared/table-search";

export function TableToolbar({
  searchPlaceholder,
  filters,
  showSearch = true,
}: {
  searchPlaceholder?: string;
  /** @deprecated Prefer page size in TablePagination footer */
  defaultLimit?: number;
  filters?: React.ReactNode;
  paramPrefix?: string;
  showSearch?: boolean;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 border-b border-navy-100 pb-4 md:flex-row md:items-center md:justify-between">
      {showSearch && searchPlaceholder ? <TableSearch placeholder={searchPlaceholder} /> : <div />}
      <div className="grid w-full min-w-0 grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">{filters}</div>
    </div>
  );
}
