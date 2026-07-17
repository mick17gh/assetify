"use client";

import { createContext, useContext, useTransition } from "react";

const PendingFormContext = createContext(false);

export function usePendingForm() {
  return useContext(PendingFormContext);
}

export function PendingForm({
  action,
  onSuccess,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  onSuccess?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <PendingFormContext.Provider value={isPending}>
      <form
        className={className}
        action={(formData) => {
          startTransition(async () => {
            await action(formData);
            onSuccess?.();
          });
        }}
      >
        {children}
      </form>
    </PendingFormContext.Provider>
  );
}
