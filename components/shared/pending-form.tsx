"use client";

import { createContext, useContext, useTransition } from "react";
import { toast } from "sonner";

const PendingFormContext = createContext(false);

export function usePendingForm() {
  return useContext(PendingFormContext);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    // Next.js digests opaque server errors as "An error occurred in the Server Components render..."
    if (!error.message.includes("Server Components") && !error.message.startsWith("NEXT_")) {
      return error.message;
    }
  }
  return "Something went wrong. Please try again.";
}

function shouldRethrow(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const digest = "digest" in error ? String((error as { digest?: unknown }).digest ?? "") : "";
  return digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND");
}

export function PendingForm({
  action,
  onSuccess,
  className,
  successMessage = "Saved.",
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  onSuccess?: () => void;
  className?: string;
  /** Pass `false` to skip the success toast. */
  successMessage?: string | false;
  children: React.ReactNode;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <PendingFormContext.Provider value={isPending}>
      <form
        className={className}
        action={(formData) => {
          startTransition(async () => {
            try {
              await action(formData);
              if (successMessage) toast.success(successMessage);
              onSuccess?.();
            } catch (error) {
              if (shouldRethrow(error)) throw error;
              toast.error(getErrorMessage(error));
            }
          });
        }}
      >
        {children}
      </form>
    </PendingFormContext.Provider>
  );
}
