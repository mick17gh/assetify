import { db } from "@/lib/db";
import type { AppSession } from "@/lib/session";

export async function getReferenceDataForSession(session: AppSession) {
  const orgId = session.organizationId ?? undefined;
  const branchFilter = session.branchId ? { branchId: session.branchId } : {};

  const [branches, categories, vendors, users, departments, rooms, shelves] = await Promise.all([
    db.branch.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.vendor.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.user.findMany({
      where: { organizationId: orgId, isActive: true, ...branchFilter },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
    db.department.findMany({
      where: { branch: { organizationId: orgId } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, branchId: true },
    }),
    db.room.findMany({
      where: { branch: { organizationId: orgId } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, branchId: true },
    }),
    db.shelf.findMany({
      where: { room: { branch: { organizationId: orgId } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, roomId: true },
    }),
  ]);

  return {
    branches: branches.map((b) => ({ id: b.id, label: `${b.name} (${b.code})` })),
    categories: categories.map((c) => ({ id: c.id, label: c.name })),
    vendors: vendors.map((v) => ({ id: v.id, label: v.name })),
    custodians: users.map((u) => ({ id: u.id, label: `${u.name} (${u.email})` })),
    departments,
    rooms,
    shelves,
  };
}
