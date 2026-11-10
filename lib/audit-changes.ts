export type FieldChange = { field: string; from: unknown; to: unknown };

export function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: string[],
): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const field of fields) {
    const from = before[field] ?? null;
    const to = after[field] ?? null;
    if (String(from ?? "") !== String(to ?? "")) {
      changes.push({ field, from, to });
    }
  }
  return changes;
}
