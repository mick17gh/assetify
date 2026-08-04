"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { isStaleClientError, notifyUpdateAvailable } from "@/lib/update-available";

const PendingFormContext = createContext(false);
const FormValidityContext = createContext(true);

export function usePendingForm() {
  return useContext(PendingFormContext);
}

export function useFormValidity() {
  return useContext(FormValidityContext);
}

/** Notify nearest form to re-check HTML validity after controlled field updates. */
export function notifyFormValidity(target: EventTarget | null) {
  const el = target instanceof Element ? target : null;
  const form = el?.closest("form");
  form?.dispatchEvent(new Event("input", { bubbles: true }));
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
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
  requireValid = true,
}: {
  action: (formData: FormData) => Promise<void>;
  onSuccess?: () => void;
  className?: string;
  /** Pass `false` to skip the success toast. */
  successMessage?: string | false;
  children: React.ReactNode;
  /** When true, SubmitButton stays disabled until HTML constraint validation passes. */
  requireValid?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [isValid, setIsValid] = useState(!requireValid);

  const revalidate = useCallback(() => {
    if (!requireValid) {
      setIsValid(true);
      return;
    }
    const form = formRef.current;
    if (!form) {
      setIsValid(false);
      return;
    }
    setIsValid(form.checkValidity());
  }, [requireValid]);

  useEffect(() => {
    revalidate();
  }, [revalidate]);

  return (
    <PendingFormContext.Provider value={isPending}>
      <FormValidityContext.Provider value={!requireValid || isValid}>
        <form
          ref={formRef}
          className={className}
          noValidate={requireValid}
          onInput={revalidate}
          onChange={revalidate}
          onClick={revalidate}
          action={(formData) => {
            if (requireValid && formRef.current && !formRef.current.checkValidity()) {
              formRef.current.reportValidity();
              revalidate();
              return;
            }
            startTransition(async () => {
              try {
                await action(formData);
                if (successMessage) toast.success(successMessage);
                onSuccess?.();
              } catch (error) {
                if (shouldRethrow(error)) throw error;
                if (isStaleClientError(error)) {
                  notifyUpdateAvailable("This page is out of date after a deploy. Refresh, then try again.");
                  return;
                }
                toast.error(getErrorMessage(error));
              }
            });
          }}
        >
          {children}
        </form>
      </FormValidityContext.Provider>
    </PendingFormContext.Provider>
  );
}
