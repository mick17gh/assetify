import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { getUserScopeWhere } from "@/lib/scoping";
import { getOptionalQuery, SearchParams } from "@/lib/filters/query";
import { getNextCursor, resolveCursorPaginationFromParams } from "@/lib/pagination/cursor";
import { Prisma } from "@/lib/generated/prisma/client";

export default async function StaffListPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getRequiredSession();
  const params = await searchParams;
  const q = getOptionalQuery(params, "q");
  const { cursor, limit, take } = resolveCursorPaginationFromParams(params);
  const scope = getUserScopeWhere(session);

  const where: Prisma.UserWhereInput = {
    ...scope,
    isActive: true,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const staff = await db.user.findMany({
    where,
    include: {
      branch: true,
      staffProfile: true,
      _count: { select: { assignedAssets: true } },
    },
    orderBy: { name: "asc" },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take,
  });
  const nextCursor = getNextCursor(staff, limit);
  const pageItems = staff.slice(0, limit);

  return (
    <div>
      <PageHeader
        title="Staff Directory"
        description="View staff members and open profiles to see allocated assets and tracking history."
      />
      <Card className="border-purple-200 shadow-sm">
        <CardContent className="pt-6">
          <TableToolbar searchPlaceholder="Search staff by name or email" defaultLimit={limit} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-purple-100 text-left text-purple-900/70">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Branch</th>
                  <th className="pb-3 font-medium">Allocated Assets</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((member) => (
                  <tr key={member.id} className="border-b border-purple-50">
                    <td className="py-3">
                      <Link href={`/staff/${member.id}`} className="font-medium text-[#6D28D9] hover:underline">
                        {member.name}
                      </Link>
                    </td>
                    <td className="py-3">{member.email}</td>
                    <td className="py-3">
                      <Badge variant="secondary">{member.role}</Badge>
                    </td>
                    <td className="py-3">{member.branch?.name ?? "—"}</td>
                    <td className="py-3">{member._count.assignedAssets}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationControls nextCursor={nextCursor} shownCount={pageItems.length} limit={limit} />
        </CardContent>
      </Card>
    </div>
  );
}
