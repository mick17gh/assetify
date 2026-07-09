import { z } from "zod";

export function enumFromConst<T extends Record<string, string>>(obj: T) {
  const values = Object.values(obj) as [T[keyof T], ...T[keyof T][]];
  return z.enum(values);
}

export const optionalCuid = z.string().cuid().optional().or(z.literal(""));

export function parseOptionalCuid(value: string | undefined) {
  if (!value?.trim()) return undefined;
  return value;
}
