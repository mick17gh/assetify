import { db } from "@/lib/db";
import { ASSET_STATUS, RECOMMENDATION_STATE } from "@/constants";
import { evaluateReplacement } from "@/lib/replacement";

export async function syncReplacementForAsset(assetId: string) {
  const asset = await db.asset.findUnique({
    where: { id: assetId },
    include: { category: true },
  });
  if (!asset) return;

  const policy =
    (await db.replacementPolicy.findFirst({
      where: {
        organizationId: asset.organizationId,
        categoryId: asset.categoryId,
      },
    })) ??
    (await db.replacementPolicy.findFirst({
      where: { organizationId: asset.organizationId, isDefault: true },
    }));

  const replacementYears = policy?.replacementYears ?? asset.category.replacementYears;
  const disposalGraceMonths = policy?.disposalGraceMonths ?? asset.category.disposalGraceMonths;

  const result = evaluateReplacement({
    purchaseDate: asset.purchaseDate,
    replacementYears,
    disposalGraceMonths,
    estimatedReplacementCost: Number(asset.purchaseCost),
  });

  await db.replacementEvaluation.create({
    data: {
      assetId: asset.id,
      expectedEndOfLifeDate: result.expectedEndOfLifeDate,
      recommendedReplaceDate: result.recommendedReplaceDate,
      disposalEligibleDate: result.disposalEligibleDate,
      state: result.state,
      estimatedReplacementCost: result.estimatedReplacementCost,
    },
  });

  if (result.state === RECOMMENDATION_STATE.OVERDUE && new Date() >= result.disposalEligibleDate) {
    const existing = await db.disposalRecommendation.findFirst({
      where: { assetId: asset.id },
      orderBy: { recommendedAt: "desc" },
    });
    if (!existing) {
      await db.disposalRecommendation.create({
        data: {
          assetId: asset.id,
          state: result.state,
          recommendedAt: new Date(),
          reason: "Asset exceeded end-of-life and disposal grace period.",
        },
      });
    }
  }

  if (asset.status === ASSET_STATUS.DISPOSED) {
    await db.disposalRecommendation.create({
      data: {
        assetId: asset.id,
        state: RECOMMENDATION_STATE.OVERDUE,
        recommendedAt: new Date(),
        reason: "Asset marked as disposed.",
      },
    });
  }
}

export async function recomputeReplacementForOrg(organizationId: string, branchId?: string | null) {
  const assets = await db.asset.findMany({
    where: {
      organizationId,
      isActive: true,
      ...(branchId ? { branchId } : {}),
    },
    select: { id: true },
    take: 500,
  });
  for (const asset of assets) {
    await syncReplacementForAsset(asset.id);
  }
}
