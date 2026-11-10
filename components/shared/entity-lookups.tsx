"use client";

import { useCallback } from "react";
import {
  searchAssetsForPickerAction,
  searchUsersForPickerAction,
  searchVendorsForPickerAction,
} from "@/app/(dashboard)/lookups/actions";
import { LookupPicker, LookupSelect } from "@/components/shared/lookup-picker";
import { fetchPickerCached } from "@/lib/lookups/picker-cache";
import type { PickerOption } from "@/lib/lookups/types";

function useCachedSearch(namespace: string, searchAction: (q: string) => Promise<{ options: PickerOption[] }>) {
  return useCallback(
    (query: string) =>
      fetchPickerCached(namespace, query, async (q) => {
        const result = await searchAction(q);
        return result.options;
      }),
    [namespace, searchAction],
  );
}

export function AssetLookupPicker({
  value,
  onValueChange,
  seed = [],
  allowNone = false,
  noneLabel = "All assets",
  placeholder = "All assets",
  className,
}: {
  value: string;
  onValueChange: (id: string) => void;
  seed?: PickerOption[];
  allowNone?: boolean;
  noneLabel?: string;
  placeholder?: string;
  className?: string;
}) {
  const searchFn = useCachedSearch("assets", searchAssetsForPickerAction);
  return (
    <LookupPicker
      value={value}
      onValueChange={onValueChange}
      seed={seed}
      searchFn={searchFn}
      preferLocalCache={seed.length > 0}
      allowNone={allowNone}
      noneLabel={noneLabel}
      placeholder={placeholder}
      searchPlaceholder="Search name, AIN, serial…"
      className={className}
    />
  );
}

export function AssetLookupSelect({
  name,
  label = "Asset",
  required,
  defaultValue,
  value,
  onValueChange,
  seed = [],
  allowNone,
  noneLabel,
  placeholder,
}: {
  name: string;
  label?: string;
  required?: boolean;
  defaultValue?: string;
  value?: string;
  onValueChange?: (id: string) => void;
  seed?: PickerOption[];
  allowNone?: boolean;
  noneLabel?: string;
  placeholder?: string;
}) {
  const searchFn = useCachedSearch("assets", searchAssetsForPickerAction);
  return (
    <LookupSelect
      name={name}
      label={label}
      required={required}
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      seed={seed}
      searchFn={searchFn}
      allowNone={allowNone}
      noneLabel={noneLabel}
      placeholder={placeholder ?? "Select asset..."}
      searchPlaceholder="Search name, AIN, serial…"
    />
  );
}

export function UserLookupPicker({
  value,
  onValueChange,
  seed = [],
  allowNone = false,
  noneLabel = "All people",
  placeholder = "All people",
  className,
}: {
  value: string;
  onValueChange: (id: string) => void;
  seed?: PickerOption[];
  allowNone?: boolean;
  noneLabel?: string;
  placeholder?: string;
  className?: string;
}) {
  const searchFn = useCachedSearch("users", searchUsersForPickerAction);
  return (
    <LookupPicker
      value={value}
      onValueChange={onValueChange}
      seed={seed}
      searchFn={searchFn}
      preferLocalCache={seed.length > 0}
      allowNone={allowNone}
      noneLabel={noneLabel}
      placeholder={placeholder}
      searchPlaceholder="Search name or email…"
      className={className}
    />
  );
}

export function UserLookupSelect({
  name,
  label = "Person",
  required,
  defaultValue,
  value,
  onValueChange,
  seed = [],
  allowNone,
  noneLabel = "None",
  placeholder,
}: {
  name: string;
  label?: string;
  required?: boolean;
  defaultValue?: string;
  value?: string;
  onValueChange?: (id: string) => void;
  seed?: PickerOption[];
  allowNone?: boolean;
  noneLabel?: string;
  placeholder?: string;
}) {
  const searchFn = useCachedSearch("users", searchUsersForPickerAction);
  return (
    <LookupSelect
      name={name}
      label={label}
      required={required}
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      seed={seed}
      searchFn={searchFn}
      allowNone={allowNone}
      noneLabel={noneLabel}
      placeholder={placeholder ?? `Select ${label.toLowerCase()}...`}
      searchPlaceholder="Search name or email…"
    />
  );
}

export function VendorLookupPicker({
  value,
  onValueChange,
  seed = [],
  allowNone = false,
  noneLabel = "None",
  placeholder = "Select vendor...",
  className,
}: {
  value: string;
  onValueChange: (id: string) => void;
  seed?: PickerOption[];
  allowNone?: boolean;
  noneLabel?: string;
  placeholder?: string;
  className?: string;
}) {
  const searchFn = useCachedSearch("vendors", searchVendorsForPickerAction);
  return (
    <LookupPicker
      value={value}
      onValueChange={onValueChange}
      seed={seed}
      searchFn={searchFn}
      preferLocalCache={seed.length > 0}
      allowNone={allowNone}
      noneLabel={noneLabel}
      placeholder={placeholder}
      searchPlaceholder="Search vendor name…"
      className={className}
    />
  );
}

export function VendorLookupSelect({
  name,
  label = "Vendor",
  required,
  defaultValue,
  value,
  onValueChange,
  seed = [],
  allowNone = true,
  noneLabel = "None",
  placeholder,
}: {
  name: string;
  label?: string;
  required?: boolean;
  defaultValue?: string;
  value?: string;
  onValueChange?: (id: string) => void;
  seed?: PickerOption[];
  allowNone?: boolean;
  noneLabel?: string;
  placeholder?: string;
}) {
  const searchFn = useCachedSearch("vendors", searchVendorsForPickerAction);
  return (
    <LookupSelect
      name={name}
      label={label}
      required={required}
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      seed={seed}
      searchFn={searchFn}
      allowNone={allowNone}
      noneLabel={noneLabel}
      placeholder={placeholder ?? "Select vendor..."}
      searchPlaceholder="Search vendor name…"
    />
  );
}
