"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ENUM_LABELS } from "@/constants";

type EnumSelectProps = {
  name: string;
  label: string;
  labelKey: keyof typeof ENUM_LABELS;
  values: Record<string, string>;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
  onValueChange?: (value: string) => void;
  value?: string;
};

export function EnumSelect({
  name,
  label,
  labelKey,
  values,
  defaultValue,
  required,
  placeholder = "Select...",
  onValueChange,
  value,
}: EnumSelectProps) {
  const labels = ENUM_LABELS[labelKey] ?? {};
  const entries = Object.values(values);
  const [internal, setInternal] = useState(defaultValue ?? "");

  const selected = value ?? internal;

  return (
    <div className="w-full space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <input type="hidden" name={name} value={selected} required={required} />
      <Select
        value={selected}
        onValueChange={(next) => {
          setInternal(next);
          onValueChange?.(next);
        }}
      >
        <SelectTrigger id={name} className="cursor-pointer border-purple-200">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {entries.map((entry) => (
            <SelectItem key={entry} value={entry}>
              {labels[entry] ?? entry}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function EnumSelectFilter({
  name,
  label,
  labelKey,
  values,
  value,
  onValueChange,
  allowAll = true,
}: Omit<EnumSelectProps, "defaultValue" | "required"> & { allowAll?: boolean }) {
  const labels = ENUM_LABELS[labelKey] ?? {};
  const entries = Object.values(values);

  return (
    <div className="space-y-1">
      {/* <Label htmlFor={name}>{label}</Label> */}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={name} className="h-9 w-[160px] cursor-pointer border-purple-200">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          {allowAll ? <SelectItem value="ALL">All</SelectItem> : null}
          {entries.map((entry) => (
            <SelectItem key={entry} value={entry}>
              {labels[entry] ?? entry}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
