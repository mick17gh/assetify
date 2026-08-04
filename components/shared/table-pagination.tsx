"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getQueryNavigationTarget } from "@/lib/filters/query";
import { getTotalPages } from "@/lib/pagination/page";
import { PAGINATION } from "@/constants";

const DEFAULT_PAGE_SIZE_OPTIONS = PAGINATION.PAGE_SIZE_OPTIONS.map(String);

export function TablePagination({
  currentPage,
  totalItems,
  pageSize,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  paramPrefix = "",
  showPageSize = true,
}: {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions?: readonly string[] | string[];
  paramPrefix?: string;
  showPageSize?: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const pageKey = `${paramPrefix}page`;
  const limitKey = `${paramPrefix}limit`;
  const totalPages = getTotalPages(totalItems, pageSize);
  const page = Math.min(Math.max(1, currentPage), totalPages);
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  function navigate(mutate: (next: URLSearchParams) => void) {
    const target = getQueryNavigationTarget(params, (next) => {
      next.delete(`${paramPrefix}cursor`);
      next.delete(`${paramPrefix}stack`);
      mutate(next);
    });
    if (!target) return;
    startTransition(() => {
      router.replace(target);
    });
  }

  function goToPage(nextPage: number) {
    navigate((next) => {
      if (nextPage <= 1) next.delete(pageKey);
      else next.set(pageKey, String(nextPage));
    });
  }

  function changePageSize(size: string) {
    navigate((next) => {
      next.set(limitKey, size);
      next.delete(pageKey);
    });
  }

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-purple-100 pt-4 md:flex-row md:items-center md:justify-between">
      <p className="text-xs font-medium text-purple-900/65">
        {totalItems === 0
          ? "Showing 0 results"
          : `Showing ${from.toLocaleString()} to ${to.toLocaleString()} of ${totalItems.toLocaleString()}`}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {showPageSize ? (
          <>
            <span className="text-xs font-medium text-purple-900/65">Rows</span>
            <Select value={String(pageSize)} onValueChange={changePageSize} disabled={isPending}>
              <SelectTrigger className="h-9 w-[110px] cursor-pointer rounded-lg border-purple-200 bg-white">
                <SelectValue placeholder="Rows" />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option} rows
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        ) : null}
        <Button
          variant="outline"
          size="icon"
          onClick={() => goToPage(1)}
          disabled={page <= 1 || isPending}
          className="h-9 w-9 cursor-pointer border-purple-200"
          aria-label="First page"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronsLeft className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1 || isPending}
          className="h-9 cursor-pointer border-purple-200"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>
        <span className="min-w-[88px] text-center text-xs font-medium text-purple-900/80">
          Page {page} of {totalPages}
        </span>
        <Button
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages || isPending}
          className="h-9 cursor-pointer bg-[#7C3AED] hover:bg-[#6D28D9]"
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => goToPage(totalPages)}
          disabled={page >= totalPages || isPending}
          className="h-9 w-9 cursor-pointer border-purple-200"
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
