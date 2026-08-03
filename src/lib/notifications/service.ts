import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { backgroundJobs, notifications } from "@/lib/db/schema";
import { jobInsertValues } from "@/lib/jobs/queue";
import { sendEmail } from "@/lib/notifications/email";
import { renderEmailTemplate } from "@/lib/notifications/templates";
import { InvitationOperationError, resolveInvitationEmailPayload } from "@/lib/workspaces/invitations";

export const notificationInputSchema = z.object({
  recipient: z.email().max(255).transform((value) => value.toLowerCase()),
  template: z.string().min(3).max(120),
  payload: z.record(z.string(), z.unknown()),
  deduplicationKey: z.string().min(1).max(255)
});

export async function enqueueEmailNotification(input: z.input<typeof notificationInputSchema>) {
  const value = notificationInputSchema.parse(input);
  return getDb().transaction(async (tx) => {
    const [notification] = await tx.insert(notifications).values({ channel: "email", recipient: value.recipient, template: value.template, payload: value.payload }).returning();
    if (!notification) throw new Error("Could not persist notification");
    await tx.insert(backgroundJobs).values(jobInsertValues({
      type: "notification.email", payload: { notificationId: notification.id }, deduplicationKey: value.deduplicationKey
    }));
    return notification;
  });
}

export async function deliverEmailNotification(payload: Record<string, unknown>) {
  const { notificationId } = z.object({ notificationId: z.uuid() }).parse(payload);
  const db = getDb();
  const [notification] = await db.select().from(notifications).where(eq(notifications.id, notificationId)).limit(1);
  if (!notification) throw new Error("Notification not found");
  if (notification.status === "sent") return;
  try {
    const templatePayload = notification.template === "workspace.invitation"
      ? await resolveInvitationEmailPayload(z.object({ invitationId: z.uuid() }).parse(notification.payload).invitationId)
      : notification.payload;
    const rendered = renderEmailTemplate(notification.template, templatePayload);
    const result = await sendEmail({ to: notification.recipient, ...rendered });
    await db.update(notifications).set({ status: "sent", provider: result.provider, externalId: result.externalId, sentAt: new Date(), lastError: null, updatedAt: new Date() }).where(eq(notifications.id, notification.id));
  } catch (error) {
    if (error instanceof InvitationOperationError && error.code === "EXPIRED") {
      await db.update(notifications).set({ status: "canceled", lastError: error.message, updatedAt: new Date() }).where(eq(notifications.id, notification.id));
      return;
    }
    await db.update(notifications).set({ status: "failed", lastError: (error instanceof Error ? error.message : String(error)).slice(0, 4000), updatedAt: new Date() }).where(eq(notifications.id, notification.id));
    throw error;
  }
}
