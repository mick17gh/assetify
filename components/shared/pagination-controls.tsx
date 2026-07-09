"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getQueryNavigationTarget } from "@/lib/filters/query";

export function PaginationControls({
  nextCursor,
  shownCount,
  limit,
}: {
  nextCursor: string | null;
  shownCount: number;
  limit: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<"reset" | "prev" | "next" | null>(null);
  const params = useSearchParams();
  const currentCursor = params.get("cursor") ?? "";
  const stack = useMemo(
    () =>
      (params.get("stack") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [params],
  );
  const prevToken = stack.length ? stack[stack.length - 1] : null;
  const hasPrevious = prevToken !== null;
  const hasNext = Boolean(nextCursor);
  const isNextLoading = isPending && activeAction === "next";
  const isPrevLoading = isPending && activeAction === "prev";
  const isResetLoading = isPending && activeAction === "reset";

  const navigateNext = () => {
    if (!nextCursor) return;
    const target = getQueryNavigationTarget(params, (next) => {
      const nextStack = [...stack, currentCursor || "ROOT"];
      next.set("stack", nextStack.join(","));
      next.set("cursor", nextCursor);
    });
    if (!target) return;
    setActiveAction("next");
    startTransition(() => {
      router.replace(target);
    });
  };

  const navigatePrevious = () => {
    if (!prevToken) return;
    const target = getQueryNavigationTarget(params, (next) => {
      const nextStack = stack.slice(0, -1);
      if (nextStack.length) next.set("stack", nextStack.join(","));
      else next.delete("stack");
      if (prevToken === "ROOT") next.delete("cursor");
      else next.set("cursor", prevToken);
    });
    if (!target) return;
    setActiveAction("prev");
    startTransition(() => {
      router.replace(target);
    });
  };

  const resetPagination = () => {
    const target = getQueryNavigationTarget(params, (next) => {
      next.delete("cursor");
      next.delete("stack");
    });
    if (!target) return;
    setActiveAction("reset");
    startTransition(() => {
      router.replace(target);
    });
  };

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-purple-100 pt-4 md:flex-row md:items-center md:justify-between">
      <p className="text-xs font-medium text-purple-900/65">
        Showing {shownCount} row{shownCount === 1 ? "" : "s"} (page size {limit})
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={resetPagination} disabled={isPending} className="cursor-pointer border-purple-200">
          {isResetLoading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-1 h-4 w-4" />}
          Reset
        </Button>
        <Button
          variant="outline"
          onClick={navigatePrevious}
          disabled={!hasPrevious || isPending}
          className="cursor-pointer border-purple-200"
        >
          {isPrevLoading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <ChevronLeft className="mr-1 h-4 w-4" />}
          Previous
        </Button>
        <Button onClick={navigateNext} disabled={!hasNext || isPending} className="cursor-pointer bg-[#7C3AED] hover:bg-[#6D28D9]">
          {isNextLoading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
