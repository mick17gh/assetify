import { cn } from "@/lib/utils";

/**
 * Small screens: two equal-width actions per row. A lone action, or the last
 * one in an odd count, spans the full row. From `sm` up: a compact trailing row.
 */
export const pageActionGroupClass =
  "grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-end [&>*:only-child]:col-span-2 [&>*:last-child:nth-child(odd)]:col-span-2 max-sm:[&_button]:h-10 max-sm:[&_button]:w-full max-sm:[&_button]:gap-1 max-sm:[&_button]:px-2.5 max-sm:[&_button_svg]:mr-0 max-sm:[&_a]:inline-flex max-sm:[&_a_svg]:mr-0 max-sm:[&_a]:h-10 max-sm:[&_a]:w-full max-sm:[&_a]:items-center max-sm:[&_a]:justify-center max-sm:[&_a]:gap-1 max-sm:[&_a]:px-2.5";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight text-balance text-navy-900 sm:text-2xl">{title}</h2>
        <p className="mt-1 text-sm text-pretty text-navy-900/65">{description}</p>
      </div>
      {action ? (
        <div
          className={cn(
            pageActionGroupClass,
            "max-sm:[&>div]:col-span-2 max-sm:[&>div]:grid max-sm:[&>div]:w-full max-sm:[&>div]:grid-cols-2 max-sm:[&>div]:gap-2 max-sm:[&>div>*:only-child]:col-span-2 max-sm:[&>div>*:last-child:nth-child(odd)]:col-span-2 max-sm:[&>form]:col-span-2 max-sm:[&>form]:w-full",
          )}
        >
          {action}
        </div>
      ) : null}
    </div>
  );
}
