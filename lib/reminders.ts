import { db } from "@/lib/db";
import { REMINDER_TYPE } from "@/constants";
import { sendEmail } from "@/lib/services/email";

export async function dispatchDueWarrantyReminders() {
  const schedules = await db.reminderSchedule.findMany({
    where: {
      reminderType: REMINDER_TYPE.WARRANTY_EXPIRY,
      sentAt: null,
      targetDate: { lte: new Date() },
    },
    take: 100,
  });

  for (const schedule of schedules) {
    const payload = schedule.payload as { email?: string; name?: string; assetName?: string };
    if (!payload.email) continue;
    const subject = "Assetify warranty reminder";
    const body = `Warranty for ${payload.assetName ?? "asset"} is due. Please review.`;

    await sendEmail({
      to: payload.email,
      subject,
      text: body,
      html: `<p>Warranty for <strong>${payload.assetName ?? "asset"}</strong> is due. Please review.</p>`,
    });

    const user = await db.user.findFirst({
      where: {
        email: payload.email,
        organizationId: schedule.organizationId,
      },
      select: { id: true },
    });
    if (user) {
      await db.notificationLog.create({
        data: {
          userId: user.id,
          type: "REMINDER_DISPATCH",
          subject,
          body,
        },
      });
    }

    await db.reminderSchedule.update({
      where: { id: schedule.id },
      data: { sentAt: new Date() },
    });
  }
}
