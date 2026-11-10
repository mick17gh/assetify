"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { searchAssetsForPickerAction } from "@/app/(dashboard)/lookups/actions";
import { FormValueInput } from "@/components/shared/form-value-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { fetchPickerCached } from "@/lib/lookups/picker-cache";
import { cn } from "@/lib/utils";

type SeedAsset = { id: string; name: string; categoryId: string };

function uniqueNames(items: Array<{ name?: string; label?: string }>) {
  const names = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const name = (item.name ?? item.label?.replace(/\s*\([^)]*\)\s*$/, "") ?? "").trim();
    if (!name || names.has(name)) continue;
    names.add(name);
    out.push(name);
  }
  return out;
}

export function AssetNameLookup({
  categoryId,
  seedAssets,
  value,
  onValueChange,
}: {
  categoryId: string;
  seedAssets: SeedAsset[];
  value: string;
  onValueChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [remoteNames, setRemoteNames] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const requestId = useRef(0);

  const seedNames = useMemo(() => {
    return uniqueNames(seedAssets.filter((asset) => !categoryId || asset.categoryId === categoryId));
  }, [seedAssets, categoryId]);

  const searchFn = useCallback(
    (q: string) =>
      fetchPickerCached(`asset-names:${categoryId}`, q, async (search) => {
        const result = await searchAssetsForPickerAction(search);
        return result.options;
      }),
    [categoryId],
  );

  useEffect(() => {
    if (!open || !categoryId) return;
    const q = query.trim();
    if (!q) {
      setRemoteNames([]);
      setSearching(false);
      return;
    }
    const handle = window.setTimeout(() => {
      const id = ++requestId.current;
      setSearching(true);
      void searchFn(q)
        .then((options) => {
          if (id !== requestId.current) return;
          setRemoteNames(uniqueNames(options));
        })
        .finally(() => {
          if (id === requestId.current) setSearching(false);
        });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [open, query, categoryId, searchFn]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const local = !q ? seedNames : seedNames.filter((name) => name.toLowerCase().includes(q));
    const merged = [...local];
    for (const name of remoteNames) {
      if (!merged.includes(name)) merged.push(name);
    }
    return merged.slice(0, 50);
  }, [seedNames, remoteNames, query]);

  return (
    <div className="relative min-w-0 space-y-1">
      <Label htmlFor="requestedAssetName">Asset name</Label>
      <FormValueInput name="requestedAssetName" value={value} required />
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (!categoryId) return;
          setOpen(next);
          if (!next) setQuery("");
        }}
      >
        <PopoverTrigger asChild>
          <Button
            id="requestedAssetName"
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={!categoryId}
            className="h-9 w-full min-w-0 cursor-pointer justify-between border-navy-200 bg-white font-normal disabled:cursor-not-allowed"
          >
            <span className="truncate text-left">
              {value || (categoryId ? "Select or type asset name" : "Select asset type first")}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search or type a new name…"
              value={query}
              onValueChange={setQuery}
            />
            {searching ? <p className="px-3 py-1 text-[11px] text-navy-900/55">Searching…</p> : null}
            <CommandList>
              <CommandEmpty>{searching ? "Searching…" : "No matching names. Type to enter a new one."}</CommandEmpty>
              <CommandGroup>
                {query.trim() && !visible.includes(query.trim()) ? (
                  <CommandItem
                    value={`use-${query.trim()}`}
                    onSelect={() => {
                      onValueChange(query.trim());
                      setOpen(false);
                    }}
                  >
                    <Check className="mr-2 h-4 w-4 opacity-0" />
                    Use “{query.trim()}”
                  </CommandItem>
                ) : null}
                {visible.map((name) => (
                  <CommandItem
                    key={name}
                    value={name}
                    onSelect={() => {
                      onValueChange(name);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === name ? "opacity-100" : "opacity-0")} />
                    <span className="truncate">{name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
