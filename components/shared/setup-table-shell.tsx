import { TableToolbar } from "@/components/shared/table-toolbar";
import { TablePagination } from "@/components/shared/table-pagination";
import { Card, CardContent } from "@/components/ui/card";
import { PAGINATION } from "@/constants";

export function SetupTableShell({
  searchPlaceholder,
  defaultLimit = PAGINATION.SETTINGS_DEFAULT_LIMIT,
  currentPage,
  totalItems,
  pageSize,
  children,
  showSearch = true,
}: {
  searchPlaceholder: string;
  defaultLimit?: number;
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  children: React.ReactNode;
  showSearch?: boolean;
}) {
  const resolvedPageSize = pageSize ?? defaultLimit;

  return (
    <Card className="border-purple-200 shadow-sm">
      <CardContent className="pt-6">
        <TableToolbar searchPlaceholder={searchPlaceholder} showSearch={showSearch} />
        {children}
        <TablePagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={resolvedPageSize}
          pageSizeOptions={PAGINATION.SETTINGS_PAGE_SIZE_OPTIONS.map(String)}
        />
      </CardContent>
    </Card>
  );
}
