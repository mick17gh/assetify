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

  const navButtonClass = "h-10 w-10 shrink-0 cursor-pointer sm:h-9 sm:w-auto";

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-navy-100 pt-4">
      <p className="text-xs font-medium text-navy-900/65">
        {totalItems === 0
          ? "Showing 0 results"
          : `Showing ${from.toLocaleString()} to ${to.toLocaleString()} of ${totalItems.toLocaleString()}`}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {showPageSize ? (
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-navy-900/65">Rows per page</span>
            <Select value={String(pageSize)} onValueChange={changePageSize} disabled={isPending}>
              <SelectTrigger className="h-10 w-36 cursor-pointer rounded-lg border-navy-200 bg-white sm:h-9 sm:w-[7.5rem]">
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
          </div>
        ) : (
          <div />
        )}
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => goToPage(1)}
            disabled={page <= 1 || isPending}
            className={`${navButtonClass} border-navy-200 px-0 sm:w-9`}
            aria-label="First page"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronsLeft className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1 || isPending}
            className={`${navButtonClass} border-navy-200 px-0 sm:px-3`}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <span className="min-w-16 px-1 text-center text-sm font-medium whitespace-nowrap text-navy-900/80 tabular-nums sm:text-xs">
            <span className="sm:hidden">
              {page} / {totalPages}
            </span>
            <span className="hidden sm:inline">
              Page {page} of {totalPages}
            </span>
          </span>
          <Button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages || isPending}
            className={`${navButtonClass} bg-navy-900 px-0 hover:bg-navy-950 sm:px-3`}
            aria-label="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4 sm:ml-1" />
          </Button>
          <Button
            variant="outline"
            onClick={() => goToPage(totalPages)}
            disabled={page >= totalPages || isPending}
            className={`${navButtonClass} border-navy-200 px-0 sm:w-9`}
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
