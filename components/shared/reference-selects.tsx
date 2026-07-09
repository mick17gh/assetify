"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export type ReferenceOption = { id: string; label: string };

export function ReferenceSelect({
  name,
  label,
  options,
  defaultValue,
  required,
  placeholder = "Select...",
  onValueChange,
  value,
}: {
  name: string;
  label: string;
  options: ReferenceOption[];
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
  onValueChange?: (value: string) => void;
  value?: string;
}) {
  const [internal, setInternal] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const selected = value ?? internal;
  const selectedOption = options.find((option) => option.id === selected);

  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <input type="hidden" name={name} value={selected} required={required} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={name}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-9 w-full cursor-pointer justify-between border-purple-200 bg-white font-normal"
          >
            <span className="truncate text-left">{selectedOption?.label ?? placeholder}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>No options found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={`${option.id} ${option.label}`}
                    onSelect={() => {
                      setInternal(option.id);
                      onValueChange?.(option.id);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", selected === option.id ? "opacity-100" : "opacity-0")} />
                    <span className="truncate">{option.label}</span>
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

export function OptionalReferenceSelect({
  name,
  label,
  options,
  defaultValue,
  onValueChange,
  value,
}: {
  name: string;
  label: string;
  options: ReferenceOption[];
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  value?: string;
}) {
  const [internal, setInternal] = useState(defaultValue ?? "NONE");
  const [open, setOpen] = useState(false);
  const selected = value ?? internal;
  const selectedOption = options.find((option) => option.id === selected);
  const selectedLabel = selected === "NONE" ? "None" : selectedOption?.label ?? "None";

  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <input type="hidden" name={name} value={selected === "NONE" ? "" : selected} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={name}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-9 w-full cursor-pointer justify-between border-purple-200 bg-white font-normal"
          >
            <span className="truncate text-left">{selectedLabel}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>No options found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="none"
                  onSelect={() => {
                    setInternal("NONE");
                    onValueChange?.("NONE");
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", selected === "NONE" ? "opacity-100" : "opacity-0")} />
                  None
                </CommandItem>
                {options.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={`${option.id} ${option.label}`}
                    onSelect={() => {
                      setInternal(option.id);
                      onValueChange?.(option.id);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", selected === option.id ? "opacity-100" : "opacity-0")} />
                    <span className="truncate">{option.label}</span>
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
