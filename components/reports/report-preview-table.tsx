"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { APP_ROUTES, PAGINATION } from "@/constants";
import { getTotalPages } from "@/lib/pagination/page";

const ASSET_ID_COLUMNS = new Set(["Asset ID", "AIN"]);
const ASSET_KEY_COLUMNS = new Set(["Entity ID", "Asset Key", "assetId", "AssetId"]);

function looksLikeCuid(value: string) {
  return /^c[a-z0-9]{20,}$/i.test(value);
}

function renderCell(column: string, value: unknown) {
  const text = String(value ?? "—");
  if (text === "—") return text;
  if (ASSET_KEY_COLUMNS.has(column) && looksLikeCuid(text)) {
    return (
      <Link href={`${APP_ROUTES.ASSETS}/${text}`} className="font-medium text-navy-900 underline-offset-2 hover:underline">
        {text}
      </Link>
    );
  }
  if (ASSET_ID_COLUMNS.has(column)) {
    return (
      <Link
        href={`${APP_ROUTES.ASSETS}?q=${encodeURIComponent(text)}`}
        className="font-medium text-navy-900 underline-offset-2 hover:underline"
      >
        {text}
      </Link>
    );
  }
  return text;
}

const PAGE_SIZE_OPTIONS = PAGINATION.PAGE_SIZE_OPTIONS.map(String);

export function ReportPreviewTable({
  title,
  rows,
}: {
  title: string;
  rows: Record<string, unknown>[];
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGINATION.DEFAULT_LIMIT);

  const columns = useMemo(() => Object.keys(rows[0] ?? {}), [rows]);
  const totalItems = rows.length;
  const totalPages = getTotalPages(totalItems, pageSize);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, totalItems);
  const pageRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const navButtonClass = "h-9 w-9 shrink-0 cursor-pointer sm:w-auto";

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-navy-950">{title}</h3>
      <div className="overflow-x-auto rounded-lg border border-navy-100">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {totalItems === 0 ? (
              <TableRow>
                <TableCell colSpan={Math.max(columns.length, 1)} className="text-sm text-navy-900/65">
                  No rows.
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row, index) => (
                <TableRow key={`${title}-${(safePage - 1) * pageSize + index}`}>
                  {columns.map((column) => (
                    <TableCell key={column}>{renderCell(column, row[column])}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalItems > 0 ? (
        <div className="flex flex-col gap-3 border-t border-navy-100 pt-3">
          <p className="text-xs font-medium text-navy-900/65">
            Showing {from.toLocaleString()} to {to.toLocaleString()} of {totalItems.toLocaleString()}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-navy-900/65">Rows per page</span>
              <Select
                value={String(pageSize)}
                onValueChange={(size) => {
                  setPageSize(Number(size));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-[7.5rem] cursor-pointer rounded-lg border-navy-200 bg-white">
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
            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage(1)}
                disabled={safePage <= 1}
                className={`${navButtonClass} border-navy-200 px-0 sm:w-9`}
                aria-label="First page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage(Math.max(1, safePage - 1))}
                disabled={safePage <= 1}
                className={`${navButtonClass} border-navy-200 px-0 sm:px-3`}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
              <span className="min-w-16 px-1 text-center text-sm font-medium whitespace-nowrap text-navy-900/80 tabular-nums sm:text-xs">
                Page {safePage} of {totalPages}
              </span>
              <Button
                type="button"
                onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                disabled={safePage >= totalPages}
                className={`${navButtonClass} bg-navy-900 px-0 hover:bg-navy-950 sm:px-3`}
                aria-label="Next page"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4 sm:ml-1" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage(totalPages)}
                disabled={safePage >= totalPages}
                className={`${navButtonClass} border-navy-200 px-0 sm:w-9`}
                aria-label="Last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
