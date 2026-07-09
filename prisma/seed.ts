import { PrismaClient } from "../lib/generated/prisma/client";
import bcrypt from "bcryptjs";
import { evaluateReplacement } from "../lib/replacement";
import { ASSET_CONDITION, ASSET_STATUS } from "../constants";

const db = new PrismaClient();

async function main() {
  const organization = await db.organization.upsert({
    where: { name: "NY Assetify Demo Org" },
    update: {},
    create: { name: "NY Assetify Demo Org" },
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

  const adminEmail = "admin@assetify.com";
  const adminPassword = "pass1234";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await db.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Assetify Admin",
      role: "ADMIN",
      isActive: true,
      branchId: branch.id,
      organizationId: organization.id,
      emailVerified: true,
    },
    create: {
      name: "Assetify Admin",
      email: adminEmail,
      emailVerified: true,
      role: "ADMIN",
      isActive: true,
      branchId: branch.id,
      organizationId: organization.id,
    },
  });

  await db.account.upsert({
    where: { id: `seed-account-${adminUser.id}` },
    update: {
      accountId: adminUser.id,
      providerId: "credential",
      userId: adminUser.id,
      password: passwordHash,
    },
    create: {
      id: `seed-account-${adminUser.id}`,
      accountId: adminUser.id,
      providerId: "credential",
      userId: adminUser.id,
      password: passwordHash,
    },
  });

  console.log("[Seed] Admin user ready");
  console.log(`[Seed] Email: ${adminEmail}`);
  console.log(`[Seed] Password: ${adminPassword}`);

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
