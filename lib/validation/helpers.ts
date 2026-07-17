import { z } from "zod";

export function enumFromConst<T extends Record<string, string>>(obj: T) {
  const values = Object.values(obj) as [T[keyof T], ...T[keyof T][]];
  return z.enum(values);
}

export const entityId = z.string().trim().min(1, "ID is required");

export const optionalCuid = z.string().cuid().optional().or(z.literal(""));

export const optionalEntityId = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const optionalText = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  });

export function parseOptionalCuid(value: string | undefined) {
  if (!value?.trim()) return undefined;
  return value;
}

export function formatZodError(error: z.ZodError) {
  return error.issues.map((issue) => issue.message).join("; ") || "Invalid input.";
}
