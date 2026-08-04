"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { getQueryNavigationTarget } from "@/lib/filters/query";
import { clearPaginationParams } from "@/lib/pagination/page";
import { cn } from "@/lib/utils";

export function TableSearch({
  placeholder = "Search...",
  className,
}: {
  placeholder?: string;
  className?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const urlQuery = params.get("q") ?? "";
  const [value, setValue] = useState(urlQuery);

  useEffect(() => {
    setValue(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const trimmed = value.trim();
    // Only rewrite the URL when search text actually changes — not when page/limit changes.
    if (trimmed === urlQuery) return;

    const timeout = setTimeout(() => {
      const target = getQueryNavigationTarget(params, (next) => {
        if (trimmed) next.set("q", trimmed);
        else next.delete("q");
        clearPaginationParams(next);
      });
      if (!target) return;
      router.replace(target);
    }, 300);
    return () => clearTimeout(timeout);
  }, [value, urlQuery, params, router]);

  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-purple-700/60" />
      <Input
        value={value}
        placeholder={placeholder}
        className="h-9 rounded-lg border-purple-200 bg-white pl-9"
        onChange={(event) => setValue(event.target.value)}
      />
    </div>
  );
}
