import { PrismaClient } from "../lib/generated/prisma/client.js";

const db = new PrismaClient();
const AIN = "HQ-IT-WALK001";

function step(title, detail) {
  console.log(`\n✓ ${title}${detail ? `\n  ${detail}` : ""}`);
}

async function main() {
  const asset = await db.asset.findFirst({
    where: { ain: AIN },
    include: {
      branch: true,
      category: true,
      room: true,
      department: true,
      acknowledgements: true,
      movements: true,
      maintenanceRecords: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      disposalRecommendations: true,
      disposalRecord: true,
    },
  });
  if (!asset) throw new Error(`Asset ${AIN} not found`);

  const staff = await db.user.findFirst({ where: { email: "staff@assetify.com" } });
  const admin = await db.user.findFirst({ where: { email: "admin@assetify.com" } });
  if (!staff || !admin) throw new Error("Seed users missing");

  step("1. Created PENDING_ONBOARDING", `${asset.name} · ${asset.ain} · PO ${asset.poNumber} · INV ${asset.invoiceNumber} · ${asset.ownershipType}`);

  // Complete onboarding
  if (asset.status === "PENDING_ONBOARDING") {
    await db.asset.update({
      where: { id: asset.id },
      data: {
        status: "ACTIVE",
        onboardingCompletedAt: new Date(),
        condition: "NEW",
      },
    });
    await db.assetStatusHistory.create({
      data: {
        assetId: asset.id,
        fromStatus: "PENDING_ONBOARDING",
        toStatus: "ACTIVE",
        note: "Onboarding completed (E2E)",
      },
    });
    step("2. Complete onboarding → ACTIVE");
  } else {
    step("2. Already active", asset.status);
  }

  // Deferred staff assignment
  await db.assetMovement.create({
    data: {
      assetId: asset.id,
      movementType: "STAFF_ASSIGNMENT",
      transferReason: "EMPLOYEE_TRANSFER",
      fromCustodianId: asset.custodianId,
      toCustodianId: staff.id,
      fromBranchId: asset.branchId,
      toBranchId: asset.branchId,
      fromRoomId: asset.roomId,
      toRoomId: asset.roomId,
      fromDepartmentId: asset.departmentId,
      toDepartmentId: asset.departmentId,
      movedByUserId: admin.id,
      note: "E2E deferred assignment to Demo Staff",
    },
  });
  await db.asset.update({
    where: { id: asset.id },
    data: {
      custodianId: staff.id,
      assignmentType: "PERMANENT",
    },
  });
  const pendingAck = await db.assignmentAcknowledgement.create({
    data: {
      assetId: asset.id,
      userId: staff.id,
      status: "PENDING",
      method: null,
      acceptedAt: null,
      note: "Awaiting assignee acceptance",
    },
  });
  step("3. Staff assignment (deferred ack)", `custodian → ${staff.name}; ack ${pendingAck.id} PENDING`);

  // Accept acknowledgement
  await db.assignmentAcknowledgement.update({
    where: { id: pendingAck.id },
    data: {
      status: "ACCEPTED",
      method: "CHECKBOX",
      acceptedAt: new Date(),
      note: "Accepted by checkbox",
    },
  });
  step("4. Acknowledgement accepted", "CHECKBOX by Demo Staff");

  // Room transfer (same branch)
  const otherRoom = await db.room.findFirst({
    where: { branchId: asset.branchId, id: { not: asset.roomId ?? undefined } },
  });
  if (otherRoom) {
    await db.assetMovement.create({
      data: {
        assetId: asset.id,
        movementType: "ROOM_TRANSFER",
        transferReason: "TEMPORARY_MOVEMENT",
        fromRoomId: asset.roomId,
        toRoomId: otherRoom.id,
        fromBranchId: asset.branchId,
        toBranchId: asset.branchId,
        fromCustodianId: staff.id,
        toCustodianId: staff.id,
        movedByUserId: admin.id,
        note: `Moved to ${otherRoom.name}`,
      },
    });
    await db.asset.update({ where: { id: asset.id }, data: { roomId: otherRoom.id, shelfId: null } });
    step("5. Room transfer", `${asset.room?.name ?? "N/A"} → ${otherRoom.name}`);
  } else {
    step("5. Room transfer skipped", "no second room");
  }

  // Maintenance
  await db.maintenanceRecord.create({
    data: {
      assetId: asset.id,
      serviceDate: new Date(),
      description: "E2E preventive service — battery health check",
      cost: 250,
      vendorName: "Accra Tech Supplies",
      status: "COMPLETED",
      repairOutcome: "REPAIRED",
      warrantyClaim: false,
    },
  });
  step("6. Maintenance logged", "COMPLETED · GHS 250");

  // Disposal recommend → approve → record
  const rec = await db.disposalRecommendation.create({
    data: {
      assetId: asset.id,
      state: "OVERDUE",
      recommendedAt: new Date(),
      reason: "E2E lifecycle walk — end of useful demo life",
      condition: "FAIR",
      recommendedAction: "Sell internally",
      approvalStatus: "PENDING",
    },
  });
  await db.asset.update({ where: { id: asset.id }, data: { status: "PENDING_DISPOSAL" } });
  await db.assetStatusHistory.create({
    data: {
      assetId: asset.id,
      fromStatus: "ACTIVE",
      toStatus: "PENDING_DISPOSAL",
      note: "Disposal recommended (E2E)",
    },
  });
  step("7. Disposal recommended", "PENDING_DISPOSAL");

  await db.disposalRecommendation.update({
    where: { id: rec.id },
    data: {
      approvalStatus: "APPROVED",
      approvedById: admin.id,
      approvedAt: new Date(),
    },
  });
  step("8. Disposal approved", "by admin");

  await db.assetDisposalRecord.create({
    data: {
      assetId: asset.id,
      organizationId: asset.organizationId,
      method: "SOLD",
      disposalDate: new Date(),
      reason: "E2E sold to staff — lifecycle complete",
      salePrice: 3200,
      buyerName: "Demo Staff",
      bookValueAtDisposal: 6800,
      recommendedSalePrice: 7200,
      disposedByUserId: admin.id,
    },
  });
  await db.asset.update({
    where: { id: asset.id },
    data: { status: "SOLD", isActive: false },
  });
  await db.assetStatusHistory.create({
    data: {
      assetId: asset.id,
      fromStatus: "PENDING_DISPOSAL",
      toStatus: "SOLD",
      note: "E2E sold to staff — lifecycle complete",
    },
  });
  await db.assetDocument.create({
    data: {
      assetId: asset.id,
      documentType: "DISPOSAL_EVIDENCE",
      displayName: "E2E sale receipt placeholder",
      fileName: "e2e-sale.txt",
      fileUrl: "https://example.com/e2e-sale-receipt",
      mimeType: "text/plain",
      uploadedByUserId: admin.id,
    },
  });
  step("9. Disposal recorded", "SOLD · GHS 3200 · DISPOSAL_EVIDENCE attached");

  const final = await db.asset.findFirst({
    where: { id: asset.id },
    include: {
      statusHistory: { orderBy: { createdAt: "asc" } },
      movements: { orderBy: { createdAt: "asc" } },
      acknowledgements: { orderBy: { createdAt: "asc" } },
      maintenanceRecords: true,
      disposalRecord: true,
      documents: true,
    },
  });

  console.log("\n=== Timeline summary ===");
  for (const h of final.statusHistory) {
    console.log(`  [status] ${h.fromStatus ?? "—"} → ${h.toStatus} · ${h.note ?? ""}`);
  }
  for (const m of final.movements) {
    console.log(`  [movement] ${m.movementType} · ${m.note ?? ""}`);
  }
  for (const a of final.acknowledgements) {
    console.log(`  [ack] ${a.status} · ${a.method ?? "—"}`);
  }
  for (const m of final.maintenanceRecords) {
    console.log(`  [maint] ${m.status} · ${m.description}`);
  }
  if (final.disposalRecord) {
    console.log(`  [disposal] ${final.disposalRecord.method} · ${final.disposalRecord.reason}`);
  }
  console.log(`\nFinal status: ${final.status} · isActive=${final.isActive}`);
  console.log(`Asset URL: /assets/${final.id}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
