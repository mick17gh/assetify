"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { getQueryNavigationTarget } from "@/lib/filters/query";
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
  const [value, setValue] = useState(params.get("q") ?? "");

  useEffect(() => {
    const timeout = setTimeout(() => {
      const target = getQueryNavigationTarget(params, (next) => {
        const trimmed = value.trim();
        if (trimmed) next.set("q", trimmed);
        else next.delete("q");
        next.delete("cursor");
        next.delete("stack");
      });
      if (!target) return;
      router.replace(target);
    }, 250);
    return () => clearTimeout(timeout);
  }, [value, params, router]);

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
