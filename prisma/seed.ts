import { PrismaClient } from "../lib/generated/prisma/client";
import bcrypt from "bcryptjs";
import { evaluateReplacement } from "../lib/replacement";
import {
  ASSET_CONDITION,
  ASSET_REQUEST_STATUS,
  ASSET_REQUEST_URGENCY,
  ASSET_STATUS,
  DEPRECIATION_METHOD,
  DISPOSAL_METHOD,
  MAINTENANCE_STATUS,
  USER_ROLES,
} from "../constants";

const db = new PrismaClient();

async function main() {
  const organization = await db.organization.upsert({
    where: { name: "NY Assetify Demo Org" },
    update: { maintenanceCostThresholdPercent: 50 },
    create: { name: "NY Assetify Demo Org", maintenanceCostThresholdPercent: 50 },
  });

  const branch = await db.branch.upsert({
    where: { organizationId_code: { organizationId: organization.id, code: "HQ-ACCRA" } },
    update: {},
    create: {
      organizationId: organization.id,
      name: "Accra HQ",
      code: "HQ-ACCRA",
      address: "Airport Residential Area",
    },
  });

  const category = await db.category.upsert({
    where: { name: "Laptop" },
    update: {},
    create: { name: "Laptop", replacementYears: 3, disposalGraceMonths: 6 },
  });
  const [itDepartment, financeDepartment] = await Promise.all([
    db.department.upsert({
      where: { branchId_name: { branchId: branch.id, name: "IT Department" } },
      update: {},
      create: { branchId: branch.id, name: "IT Department" },
    }),
    db.department.upsert({
      where: { branchId_name: { branchId: branch.id, name: "Finance Department" } },
      update: {},
      create: { branchId: branch.id, name: "Finance Department" },
    }),
  ]);
  const [vendorA, vendorB] = await Promise.all([
    db.vendor.upsert({
      where: { name: "Accra Tech Supplies" },
      update: {},
      create: {
        name: "Accra Tech Supplies",
        email: "sales@accratechsupplies.com",
        phone: "+233201234567",
      },
    }),
    db.vendor.upsert({
      where: { name: "West Africa Devices Ltd" },
      update: {},
      create: {
        name: "West Africa Devices Ltd",
        email: "contact@wadevices.com",
        phone: "+233240112233",
      },
    }),
  ]);
  await db.replacementPolicy.upsert({
    where: {
      organizationId_categoryId: {
        organizationId: organization.id,
        categoryId: category.id,
      },
    },
    update: {
      replacementYears: 4,
      disposalGraceMonths: 6,
      isDefault: true,
    },
    create: {
      organizationId: organization.id,
      categoryId: category.id,
      replacementYears: 4,
      disposalGraceMonths: 6,
      isDefault: true,
    },
  });

  await db.depreciationPolicy.upsert({
    where: {
      organizationId_categoryId: {
        organizationId: organization.id,
        categoryId: category.id,
      },
    },
    update: {
      method: DEPRECIATION_METHOD.STRAIGHT_LINE,
      usefulLifeYears: 3,
      salvagePercent: 10,
      isDefault: true,
    },
    create: {
      organizationId: organization.id,
      categoryId: category.id,
      method: DEPRECIATION_METHOD.STRAIGHT_LINE,
      usefulLifeYears: 3,
      salvagePercent: 10,
      isDefault: true,
    },
  });

  const adminEmail = "admin@assetify.com";
  const financeEmail = "finance@assetify.com";
  const staffEmail = "staff@assetify.com";
  const managerEmail = "manager@assetify.com";
  const adminPassword = "pass1234";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await db.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Assetify Admin",
      role: USER_ROLES.ADMIN,
      isActive: true,
      branchId: branch.id,
      organizationId: organization.id,
      emailVerified: true,
    },
    create: {
      name: "Assetify Admin",
      email: adminEmail,
      emailVerified: true,
      role: USER_ROLES.ADMIN,
      isActive: true,
      branchId: branch.id,
      organizationId: organization.id,
    },
  });

  const financeUser = await db.user.upsert({
    where: { email: financeEmail },
    update: {
      name: "Finance Manager",
      role: USER_ROLES.FINANCE,
      isActive: true,
      branchId: branch.id,
      organizationId: organization.id,
      emailVerified: true,
    },
    create: {
      name: "Finance Manager",
      email: financeEmail,
      emailVerified: true,
      role: USER_ROLES.FINANCE,
      isActive: true,
      branchId: branch.id,
      organizationId: organization.id,
    },
  });

  const staffUser = await db.user.upsert({
    where: { email: staffEmail },
    update: {
      name: "Demo Staff",
      role: USER_ROLES.STAFF,
      isActive: true,
      branchId: branch.id,
      organizationId: organization.id,
      emailVerified: true,
    },
    create: {
      name: "Demo Staff",
      email: staffEmail,
      emailVerified: true,
      role: USER_ROLES.STAFF,
      isActive: true,
      branchId: branch.id,
      organizationId: organization.id,
    },
  });

  const managerUser = await db.user.upsert({
    where: { email: managerEmail },
    update: {
      name: "Demo Manager",
      role: USER_ROLES.MANAGER,
      isActive: true,
      branchId: branch.id,
      organizationId: organization.id,
      emailVerified: true,
    },
    create: {
      name: "Demo Manager",
      email: managerEmail,
      emailVerified: true,
      role: USER_ROLES.MANAGER,
      isActive: true,
      branchId: branch.id,
      organizationId: organization.id,
    },
  });

  for (const user of [adminUser, financeUser, staffUser, managerUser]) {
    await db.account.upsert({
      where: { id: `seed-account-${user.id}` },
      update: {
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: passwordHash,
      },
      create: {
        id: `seed-account-${user.id}`,
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: passwordHash,
      },
    });
  }

  console.log("[Seed] Users ready (password: pass1234)");
  console.log(`[Seed] Admin: ${adminEmail}`);
  console.log(`[Seed] Finance: ${financeEmail}`);
  console.log(`[Seed] Manager: ${managerEmail}`);
  console.log(`[Seed] Staff: ${staffEmail}`);

  const assets = await Promise.all(
    Array.from({ length: 5 }).map((_, index) =>
      db.asset.upsert({
        where: { ain: `AIN-NY-DEMO-00${index + 1}` },
        update: {},
        create: {
          ain: `AIN-NY-DEMO-00${index + 1}`,
          serialNumber: `SN-DEMO-${index + 1}`,
          name: `Demo Laptop ${index + 1}`,
          status: ASSET_STATUS.ACTIVE,
          condition: ASSET_CONDITION.GOOD,
          purchaseDate: new Date(new Date().getFullYear() - (index + 1), 2, 15),
          purchaseCost: 7500 + index * 600,
          warrantyExpiryDate: new Date(Date.now() + (index + 1) * 30 * 24 * 60 * 60 * 1000),
          branchId: branch.id,
          departmentId: index % 2 === 0 ? itDepartment.id : financeDepartment.id,
          categoryId: category.id,
          vendorId: index % 2 === 0 ? vendorA.id : vendorB.id,
          organizationId: organization.id,
        },
      }),
    ),
  );

  for (const asset of assets) {
    const calc = evaluateReplacement({
      purchaseDate: asset.purchaseDate,
      replacementYears: category.replacementYears,
      disposalGraceMonths: category.disposalGraceMonths,
      estimatedReplacementCost: Number(asset.purchaseCost),
    });

    await db.replacementEvaluation.upsert({
      where: { id: `seed-${asset.id}` },
      update: {
        expectedEndOfLifeDate: calc.expectedEndOfLifeDate,
        recommendedReplaceDate: calc.recommendedReplaceDate,
        disposalEligibleDate: calc.disposalEligibleDate,
        state: calc.state,
        estimatedReplacementCost: calc.estimatedReplacementCost,
      },
      create: {
        id: `seed-${asset.id}`,
        assetId: asset.id,
        expectedEndOfLifeDate: calc.expectedEndOfLifeDate,
        recommendedReplaceDate: calc.recommendedReplaceDate,
        disposalEligibleDate: calc.disposalEligibleDate,
        state: calc.state,
        estimatedReplacementCost: calc.estimatedReplacementCost,
      },
    });

    await db.maintenanceRecord.upsert({
      where: { id: `seed-maint-${asset.id}` },
      update: {},
      create: {
        id: `seed-maint-${asset.id}`,
        assetId: asset.id,
        serviceDate: new Date(),
        description: "Routine service check",
        cost: 250 + Number(asset.purchaseCost) * 0.05,
        vendorName: "Service Partner Ltd",
        status: MAINTENANCE_STATUS.COMPLETED,
      },
    });
  }

  await db.assetRequest.upsert({
    where: { id: "seed-request-1" },
    update: {},
    create: {
      id: "seed-request-1",
      requesterId: staffUser.id,
      organizationId: organization.id,
      branchId: branch.id,
      departmentId: itDepartment.id,
      categoryId: category.id,
      reason: "Need a laptop for remote project work",
      urgency: ASSET_REQUEST_URGENCY.HIGH,
      notes: "Prefer 16GB RAM model",
      status: ASSET_REQUEST_STATUS.PENDING,
    },
  });

  const disposedAsset = assets[4];
  if (disposedAsset) {
    await db.asset.update({
      where: { id: disposedAsset.id },
      data: { status: ASSET_STATUS.SOLD, isActive: false },
    });
    await db.assetDisposalRecord.upsert({
      where: { assetId: disposedAsset.id },
      update: {},
      create: {
        assetId: disposedAsset.id,
        organizationId: organization.id,
        method: DISPOSAL_METHOD.SOLD,
        disposalDate: new Date(),
        reason: "Sold to employee at end of lease",
        salePrice: 1200,
        buyerName: "Former Employee",
        buyerContact: "employee@example.com",
        bookValueAtDisposal: 1500,
        recommendedSalePrice: 1400,
        disposedByUserId: adminUser.id,
      },
    });
  }
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
