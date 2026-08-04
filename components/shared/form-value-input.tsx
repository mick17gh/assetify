"use client";

import { useEffect, useRef } from "react";
import { notifyFormValidity } from "@/components/shared/pending-form";

/**
 * Visible-to-validator stand-in for controlled select/combobox values.
 * Native `type="hidden"` inputs are skipped by HTML constraint validation.
 */
export function FormValueInput({
  name,
  value,
  required,
}: {
  name: string;
  value: string;
  required?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    notifyFormValidity(ref.current);
  }, [value, required]);

  return (
    <input
      ref={ref}
      type="text"
      name={name}
      value={value}
      required={required}
      readOnly
      tabIndex={-1}
      aria-hidden="true"
      className="pointer-events-none absolute h-0 w-0 opacity-0"
      onChange={() => undefined}
    />
  );
}
