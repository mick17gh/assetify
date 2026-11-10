import { ENUM_LABELS } from "@/constants";

export function formatReportDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

export function formatReportMoney(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return 0;
  return Math.round(value * 100) / 100;
}

export function formatReportPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "0%";
  return `${(value * 100).toFixed(1)}%`;
}

export function labelStatus(value: string | null | undefined): string {
  if (!value) return "—";
  return ENUM_LABELS.assetStatus[value] ?? value;
}

export function labelCondition(value: string | null | undefined): string {
  if (!value) return "—";
  return ENUM_LABELS.assetCondition[value] ?? value;
}

export function labelMovement(value: string | null | undefined): string {
  if (!value) return "—";
  return ENUM_LABELS.movementType[value] ?? value;
}

export function humanizeKey(key: string): string {
  return key
    .replace(/Rows$/, "")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}
