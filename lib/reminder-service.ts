import { db } from "@/lib/db";
import { REMINDER_TYPE } from "@/constants";

type ReminderPayload = {
  email?: string;
  name?: string;
  assetName?: string;
  assetId?: string;
};

export async function syncRemindersForAsset(assetId: string) {
  const asset = await db.asset.findUnique({
    where: { id: assetId },
    include: { custodian: true },
  });
  if (!asset?.warrantyExpiryDate || !asset.organizationId) return;

  const email = asset.custodian?.email;
  if (!email) return;

  const existing = await db.reminderSchedule.findFirst({
    where: {
      organizationId: asset.organizationId,
      reminderType: REMINDER_TYPE.WARRANTY_EXPIRY,
      sentAt: null,
      payload: { path: ["assetId"], equals: asset.id },
    },
  });

  const payload: ReminderPayload = {
    email,
    name: asset.custodian?.name,
    assetName: asset.name,
    assetId: asset.id,
  };

  if (existing) {
    await db.reminderSchedule.update({
      where: { id: existing.id },
      data: { targetDate: asset.warrantyExpiryDate, payload },
    });
    return;
  }

  await db.reminderSchedule.create({
    data: {
      organizationId: asset.organizationId,
      reminderType: REMINDER_TYPE.WARRANTY_EXPIRY,
      targetDate: asset.warrantyExpiryDate,
      payload,
    },
  });
}
