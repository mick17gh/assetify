import { PrismaClient } from "../lib/generated/prisma/client.js";

const db = new PrismaClient();

async function main() {
  const org = await db.organization.findFirst();
  if (!org) throw new Error("no org");
  const branch = await db.branch.findFirst({ where: { organizationId: org.id } });
  const category =
    (await db.category.findFirst({
      where: {
        OR: [
          { name: { contains: "Laptop", mode: "insensitive" } },
          { name: { contains: "Computer", mode: "insensitive" } },
          { name: { contains: "IT", mode: "insensitive" } },
        ],
      },
    })) ?? (await db.category.findFirst());
  const staff = await db.user.findFirst({ where: { email: "staff@assetify.com" } });
  const admin = await db.user.findFirst({ where: { email: "admin@assetify.com" } });
  const room = await db.room.findFirst({ where: { branchId: branch.id } });
  const shelf = room
    ? await db.shelf.findFirst({ where: { roomId: room.id } })
    : null;
  const dept = await db.department.findFirst({ where: { branchId: branch.id } });
  const room2 = await db.room.findFirst({
    where: { branchId: branch.id, ...(room ? { id: { not: room.id } } : {}) },
  });

  const existing = await db.asset.findFirst({ where: { ain: "HQ-IT-WALK001" } });
  if (existing) {
    await db.assignmentAcknowledgement.deleteMany({ where: { assetId: existing.id } });
    await db.assetMovement.deleteMany({ where: { assetId: existing.id } });
    await db.maintenanceRecord.deleteMany({ where: { assetId: existing.id } });
    await db.assetStatusHistory.deleteMany({ where: { assetId: existing.id } });
    await db.assetDocument.deleteMany({ where: { assetId: existing.id } });
    await db.disposalRecommendation.deleteMany({ where: { assetId: existing.id } });
    await db.assetDisposalRecord.deleteMany({ where: { assetId: existing.id } });
    await db.replacementEvaluation.deleteMany({ where: { assetId: existing.id } });
    await db.asset.delete({ where: { id: existing.id } });
  }

  const asset = await db.asset.create({
    data: {
      ain: "HQ-IT-WALK001",
      serialNumber: "DL-LAT-WALK-001",
      name: "Dell Latitude Lifecycle Walk",
      manufacturer: "Dell",
      modelName: "Latitude 5540",
      purchaseDate: new Date("2025-01-15T00:00:00.000Z"),
      purchaseCost: 8500,
      poNumber: "PO-2025-WALK-01",
      invoiceNumber: "INV-WALK-7781",
      capitalizedDate: new Date("2025-01-20T00:00:00.000Z"),
      ownershipType: "OWNED",
      status: "PENDING_ONBOARDING",
      condition: "NEW",
      categoryId: category.id,
      branchId: branch.id,
      departmentId: dept?.id ?? null,
      roomId: room?.id ?? null,
      shelfId: shelf?.id ?? null,
      organizationId: org.id,
      warrantyExpiryDate: new Date("2028-01-15T00:00:00.000Z"),
    },
  });

  await db.assetStatusHistory.create({
    data: {
      assetId: asset.id,
      fromStatus: null,
      toStatus: "PENDING_ONBOARDING",
      note: "E2E lifecycle seed — pending onboarding",
    },
  });

  console.log(
    JSON.stringify(
      {
        assetId: asset.id,
        ain: asset.ain,
        branchId: branch.id,
        branchName: branch.name,
        categoryName: category.name,
        staffId: staff?.id,
        staffName: staff?.name,
        adminId: admin?.id,
        roomId: room?.id,
        roomName: room?.name,
        room2Id: room2?.id,
        room2Name: room2?.name,
        deptId: dept?.id,
        deptName: dept?.name,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
