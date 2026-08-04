import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { UserAdmin } from "@/components/users/user-admin";
import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { getUserScopeWhere } from "@/lib/scoping";
import { getOptionalQuery, SearchParams } from "@/lib/filters/query";
import { resolvePagePaginationFromParams } from "@/lib/pagination/page";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { TablePagination } from "@/components/shared/table-pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Prisma } from "@/lib/generated/prisma/client";

export default async function UsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getRequiredSession();
  const params = await searchParams;
  const q = getOptionalQuery(params, "q");
  const { page, pageSize, skip, take } = resolvePagePaginationFromParams(params);
  const roleQuery = q && ["ADMIN", "MANAGER", "STAFF"].includes(q.toUpperCase()) ? q.toUpperCase() : undefined;
  const where: Prisma.UserWhereInput = {
    ...getUserScopeWhere(session),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            ...(roleQuery ? [{ role: roleQuery as Prisma.UserWhereInput["role"] }] : []),
          ],
        }
      : {}),
  };
  const [users, totalCount, branches] = await Promise.all([
    db.user.findMany({
      where,
      include: { branch: true },
      orderBy: { updatedAt: "desc" },
      skip,
      take,
    }),
    db.user.count({ where }),
    db.branch.findMany({
      where: { organizationId: session.organizationId ?? undefined },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Users and Permissions"
        description="Manage admin, manager, and staff accounts with role-based control."
        action={
          <UserAdmin branches={branches.map((b) => ({ id: b.id, label: `${b.name} (${b.code})` }))} />
        }
      />
      <Card className="border-purple-200 shadow-sm">
        <CardContent className="pt-6">
          <TableToolbar searchPlaceholder="Search user, email, or role" />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Link href={`/staff/${user.id}`} className="font-medium text-[#6D28D9] hover:underline">
                      {user.name}
                    </Link>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.branch?.name ?? "-"}</TableCell>
                  <TableCell>{user.isActive ? "Active" : "Inactive"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination currentPage={page} totalItems={totalCount} pageSize={pageSize} />
        </CardContent>
      </Card>
    </div>
  );
}
