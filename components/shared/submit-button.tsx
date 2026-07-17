"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { usePendingForm } from "@/components/shared/pending-form";

export function SubmitButton({
  idleLabel,
  pendingLabel,
  className,
  disabled = false,
  variant,
  size,
}: {
  idleLabel: string;
  pendingLabel: string;
  className?: string;
  disabled?: boolean;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
}) {
  const { pending: formStatusPending } = useFormStatus();
  const pendingFormPending = usePendingForm();
  const pending = formStatusPending || pendingFormPending;

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      disabled={pending || disabled}
      aria-busy={pending}
      className={className}
    >
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}
