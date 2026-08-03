import { and, eq, lt } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { analyticsEvents, backgroundJobs } from "@/lib/db/schema";
import { deliverEmailNotification } from "@/lib/notifications/service";
import { enqueuePendingOrderReconciliations, processRefund, reconcileOrder } from "@/lib/billing/service";

export type JobHandler = (payload: Record<string, unknown>) => Promise<void>;

const retentionPayloadSchema = z.object({ days: z.number().int().min(1).max(3650) });

export const jobHandlers: Readonly<Record<string, JobHandler>> = {
  "notification.email": deliverEmailNotification,
  "billing.refund": processRefund,
  "billing.reconcile_order": reconcileOrder,
  async "billing.reconcile_pending_orders"() { await enqueuePendingOrderReconciliations(); },
  async "system.noop"() {},
  async "maintenance.prune_analytics"(payload) {
    const { days } = retentionPayloadSchema.parse(payload);
    await getDb().delete(analyticsEvents).where(lt(analyticsEvents.createdAt, new Date(Date.now() - days * 86_400_000)));
  },
  async "maintenance.prune_job_history"(payload) {
    const { days } = retentionPayloadSchema.parse(payload);
    await getDb().delete(backgroundJobs).where(and(
      eq(backgroundJobs.status, "succeeded"),
      lt(backgroundJobs.completedAt, new Date(Date.now() - days * 86_400_000))
    ));
  }
};
