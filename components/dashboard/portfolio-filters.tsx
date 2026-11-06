"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ASSET_CONDITION, ASSET_STATUS } from "@/constants";
import { EnumSelectFilter } from "@/components/shared/enum-select";
import { InlineCombobox, type ReferenceOption } from "@/components/shared/reference-selects";
import { clearPaginationParams } from "@/lib/pagination/page";
import { getQueryNavigationTarget } from "@/lib/filters/query";

export function PortfolioFilters({
  regions,
  branches,
  departments,
  categories,
  custodians,
  years,
}: {
  regions: ReferenceOption[];
  branches: ReferenceOption[];
  departments: ReferenceOption[];
  categories: ReferenceOption[];
  custodians: ReferenceOption[];
  years: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  function setParam(key: string, value: string) {
    const target = getQueryNavigationTarget(params, (next) => {
      clearPaginationParams(next);
      if (!value || value === "ALL") next.delete(key);
      else next.set(key, value);
    });
    if (target) router.replace(target);
  }

  const yearOptions = years.map((year) => ({ id: year, label: year }));

  return (
    <div className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-navy-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
      <InlineCombobox value={params.get("region") ?? ""} options={regions} onValueChange={(value) => setParam("region", value)} placeholder="All regions" allowNone />
      <InlineCombobox value={params.get("branch") ?? ""} options={branches} onValueChange={(value) => setParam("branch", value)} placeholder="All branches" allowNone />
      <InlineCombobox value={params.get("department") ?? ""} options={departments} onValueChange={(value) => setParam("department", value)} placeholder="All departments" allowNone />
      <InlineCombobox value={params.get("category") ?? ""} options={categories} onValueChange={(value) => setParam("category", value)} placeholder="All categories" allowNone />
      <InlineCombobox value={params.get("custodian") ?? ""} options={custodians} onValueChange={(value) => setParam("custodian", value)} placeholder="All custodians" allowNone />
      <EnumSelectFilter name="condition" label="Condition" labelKey="assetCondition" values={ASSET_CONDITION} value={params.get("condition") ?? "ALL"} onValueChange={(value) => setParam("condition", value)} className="w-full sm:w-full" />
      <EnumSelectFilter name="status" label="Status" labelKey="assetStatus" values={ASSET_STATUS} value={params.get("status") ?? "ALL"} onValueChange={(value) => setParam("status", value)} className="w-full sm:w-full" />
      <InlineCombobox value={params.get("year") ?? ""} options={yearOptions} onValueChange={(value) => setParam("year", value)} placeholder="All acquisition years" allowNone />
    </div>
  );
}
