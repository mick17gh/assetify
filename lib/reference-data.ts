import { cache } from "react";
import { db } from "@/lib/db";
import type { AppSession } from "@/lib/session";

export const getReferenceDataForSession = cache(async (session: AppSession) => {
  const orgId = session.organizationId ?? undefined;
  const branchFilter = session.branchId ? { branchId: session.branchId } : {};

  const [branches, categories, vendors, users, departments, rooms, shelves, regions] = await Promise.all([
    db.branch.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true, regionId: true },
    }),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.vendor.findMany({ orderBy: { updatedAt: "desc" }, take: 50, select: { id: true, name: true } }),
    db.user.findMany({
      where: { organizationId: orgId, isActive: true, ...branchFilter },
      orderBy: { updatedAt: "desc" },
      take: 50,
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
    db.region.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return {
    regions: regions.map((region) => ({ id: region.id, label: region.name })),
    branches: branches.map((b) => ({
      id: b.id,
      label: `${b.name} (${b.code})`,
      code: b.code,
      regionId: b.regionId,
    })),
    categories: categories.map((c) => ({ id: c.id, label: c.name })),
    vendors: vendors.map((v) => ({ id: v.id, label: v.name })),
    custodians: users.map((u) => ({ id: u.id, label: `${u.name} (${u.email})` })),
    departments,
    rooms,
    shelves,
  };
});
