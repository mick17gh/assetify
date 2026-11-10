"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { FormValueInput } from "@/components/shared/form-value-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { PICKER_DEBOUNCE_MS, PICKER_LIMIT, type PickerOption } from "@/lib/lookups/types";
import { cn } from "@/lib/utils";

function filterLocal(options: PickerOption[], query: string, limit: number) {
  const q = query.trim().toLowerCase();
  const matched = !q
    ? options
    : options.filter((option) => {
        const haystack = `${option.label} ${option.subtitle ?? ""} ${option.id}`.toLowerCase();
        return haystack.includes(q);
      });
  return matched.slice(0, limit);
}

function pinSelected(options: PickerOption[], value: string, selected: PickerOption | null) {
  if (!value) return options;
  if (options.some((option) => option.id === value)) return options;
  if (selected && selected.id === value) return [selected, ...options];
  return options;
}

export type LookupPickerProps = {
  seed?: PickerOption[];
  value: string;
  onValueChange: (id: string) => void;
  onSelected?: (row: PickerOption | null) => void;
  searchFn: (search: string) => Promise<PickerOption[]>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  preferLocalCache?: boolean;
  seedLoading?: boolean;
  offlineOnly?: boolean;
  listLimit?: number;
  debounceMs?: number;
  placeholder?: string;
  searchPlaceholder?: string;
  allowNone?: boolean;
  noneLabel?: string;
  emptyNoQuery?: string;
  emptyWithQuery?: string;
  className?: string;
  disabled?: boolean;
};

/** Large-data lookup: seed on open, debounced slim search, stale-while-revalidate. */
export function LookupPicker({
  seed = [],
  value,
  onValueChange,
  onSelected,
  searchFn,
  open: controlledOpen,
  onOpenChange,
  preferLocalCache = true,
  seedLoading = false,
  offlineOnly = false,
  listLimit = PICKER_LIMIT,
  debounceMs = PICKER_DEBOUNCE_MS,
  placeholder = "Select...",
  searchPlaceholder = "Type to search…",
  allowNone = false,
  noneLabel = "None",
  emptyNoQuery = "Type to search…",
  emptyWithQuery = "No results.",
  className,
  disabled = false,
}: LookupPickerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickerOption[]>(() => seed.slice(0, listLimit));
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<PickerOption | null>(
    () => seed.find((option) => option.id === value) ?? null,
  );
  const requestId = useRef(0);

  useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }
    const fromSeed = seed.find((option) => option.id === value);
    if (fromSeed) setSelected(fromSeed);
  }, [seed, value]);

  useEffect(() => {
    if (!open) return;

    const q = query.trim();
    if (!q) {
      setResults(seed.slice(0, listLimit));
      setSearching(false);
      return;
    }

    if (preferLocalCache || offlineOnly) {
      setResults(filterLocal(seed, q, listLimit));
    }

    if (offlineOnly) return;

    const handle = window.setTimeout(() => {
      const id = ++requestId.current;
      setSearching(true);
      void searchFn(q)
        .then((next) => {
          if (id !== requestId.current) return;
          setResults(next.slice(0, listLimit));
        })
        .catch(() => {
          if (id !== requestId.current) return;
          setResults(filterLocal(seed, q, listLimit));
        })
        .finally(() => {
          if (id === requestId.current) setSearching(false);
        });
    }, debounceMs);

    return () => window.clearTimeout(handle);
  }, [open, query, seed, searchFn, preferLocalCache, offlineOnly, listLimit, debounceMs]);

  const visible = useMemo(
    () => pinSelected(results, value, selected),
    [results, value, selected],
  );

  const display = !value ? placeholder : (selected?.label ?? placeholder);
  const triggerLoading = seedLoading && seed.length === 0;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
        if (next) setResults(seed.slice(0, listLimit));
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || triggerLoading}
          className={cn(
            "h-9 w-full min-w-[140px] cursor-pointer justify-between border-navy-200 bg-white px-2 font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate text-left text-xs sm:text-sm">{display}</span>
          {triggerLoading ? (
            <Loader2 className="ml-1 h-3.5 w-3.5 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={setQuery}
          />
          {searching ? (
            <p className="border-b border-navy-100 px-3 py-1 text-[11px] text-navy-900/55">Searching…</p>
          ) : null}
          <CommandList>
            <CommandEmpty>{query.trim() ? emptyWithQuery : emptyNoQuery}</CommandEmpty>
            <CommandGroup>
              {allowNone ? (
                <CommandItem
                  value="__none__"
                  onSelect={() => {
                    onValueChange("");
                    onSelected?.(null);
                    setSelected(null);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
                  {noneLabel}
                </CommandItem>
              ) : null}
              {visible.map((option) => (
                <CommandItem
                  key={option.id}
                  value={`${option.id} ${option.label}`}
                  onSelect={() => {
                    onValueChange(option.id);
                    onSelected?.(option);
                    setSelected(option);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === option.id ? "opacity-100" : "opacity-0")} />
                  <span className="min-w-0 flex-1 truncate">
                    <span className="block truncate">{option.label}</span>
                    {option.subtitle ? (
                      <span className="block truncate text-[11px] text-navy-900/55">{option.subtitle}</span>
                    ) : null}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Form-friendly labeled lookup with hidden input. */
export function LookupSelect({
  name,
  label,
  required,
  defaultValue = "",
  value: controlledValue,
  onValueChange,
  seed,
  searchFn,
  placeholder,
  searchPlaceholder,
  allowNone = false,
  noneLabel = "None",
  className,
}: {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
  value?: string;
  onValueChange?: (id: string) => void;
  seed?: PickerOption[];
  searchFn: (search: string) => Promise<PickerOption[]>;
  placeholder?: string;
  searchPlaceholder?: string;
  allowNone?: boolean;
  noneLabel?: string;
  className?: string;
}) {
  const [internal, setInternal] = useState(defaultValue);
  const selected = controlledValue ?? internal;

  return (
    <div className={cn("relative min-w-0 space-y-1", className)}>
      <Label htmlFor={name}>{label}</Label>
      <FormValueInput name={name} value={selected} required={required && !allowNone} />
      <LookupPicker
        value={selected}
        seed={seed}
        searchFn={searchFn}
        preferLocalCache={Boolean(seed?.length)}
        allowNone={allowNone}
        noneLabel={noneLabel}
        placeholder={placeholder ?? `Select ${label.toLowerCase()}...`}
        searchPlaceholder={searchPlaceholder}
        onValueChange={(id) => {
          setInternal(id);
          onValueChange?.(id);
        }}
      />
    </div>
  );
}
