import { TableToolbar } from "@/components/shared/table-toolbar";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { Card, CardContent } from "@/components/ui/card";

export function SetupTableShell({
  searchPlaceholder,
  defaultLimit,
  nextCursor,
  shownCount,
  children,
}: {
  searchPlaceholder: string;
  defaultLimit: number;
  nextCursor: string | null;
  shownCount: number;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-purple-200 shadow-sm">
      <CardContent className="pt-6">
        <TableToolbar searchPlaceholder={searchPlaceholder} defaultLimit={defaultLimit} />
        {children}
        <PaginationControls nextCursor={nextCursor} shownCount={shownCount} limit={defaultLimit} />
      </CardContent>
    </Card>
  );
}
