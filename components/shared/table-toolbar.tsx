"use client";

import { TableSearch } from "@/components/shared/table-search";

export function TableToolbar({
  searchPlaceholder,
  filters,
  showSearch = true,
  singleLine = false,
}: {
  searchPlaceholder?: string;
  /** @deprecated Prefer page size in TablePagination footer */
  defaultLimit?: number;
  filters?: React.ReactNode;
  paramPrefix?: string;
  showSearch?: boolean;
  /** Keep search and filters on one row. Search stays narrow so the filters fit. */
  singleLine?: boolean;
}) {
  return (
    <div
      className={
        singleLine
          ? "mb-4 flex flex-nowrap items-center gap-2 border-b border-navy-100 pb-4"
          : "mb-4 flex flex-col gap-3 border-b border-navy-100 pb-4 md:flex-row md:items-center md:justify-between"
      }
    >
      {showSearch && searchPlaceholder ? (
        <TableSearch placeholder={searchPlaceholder} className={singleLine ? "w-44 max-w-none shrink-0" : undefined} />
      ) : (
        <div />
      )}
      <div
        className={
          singleLine
            ? "flex min-w-0 flex-1 flex-nowrap items-center gap-2"
            : "grid w-full min-w-0 grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center"
        }
      >
        {filters}
      </div>
    </div>
  );
}
