import { and, eq } from "drizzle-orm";
import { z } from "zod";

import type { AuthAccount } from "@/lib/auth/server";
import { getDb } from "@/lib/db/client";
import { auditLogs, backgroundJobs } from "@/lib/db/schema";

export const adminJobActionSchema = z.object({ action: z.enum(["retry", "cancel"]) });

export class AdminJobOperationError extends Error {
  constructor(
    message: string,
    readonly code: "NOT_FOUND" | "INVALID_JOB_STATE" = "INVALID_JOB_STATE",
    readonly status: 404 | 409 = 409
  ) {
    super(message);
    this.name = "AdminJobOperationError";
  }
}

export async function manageJobByAdmin(
  actor: AuthAccount,
  jobId: string,
  input: z.infer<typeof adminJobActionSchema>,
  context: { requestId?: string; clientIp?: string }
) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const [current] = await tx.select().from(backgroundJobs).where(eq(backgroundJobs.id, jobId)).limit(1).for("update");
    if (!current) {
      throw new AdminJobOperationError("Background job not found", "NOT_FOUND", 404);
    }
    const valid = input.action === "retry"
      ? current.status === "failed" || current.status === "cancelled"
      : current.status === "queued";
    if (!valid) throw new AdminJobOperationError(`Cannot ${input.action} a ${current.status} job`);
    const now = new Date();
    const [updated] = await tx.update(backgroundJobs).set(input.action === "retry" ? {
      status: "queued", attempts: 0, runAt: now, lockedAt: null, lockedBy: null,
      lastError: null, completedAt: null, updatedAt: now
    } : { status: "cancelled", completedAt: now, updatedAt: now })
      .where(and(eq(backgroundJobs.id, jobId), eq(backgroundJobs.status, current.status))).returning();
    if (!updated) throw new AdminJobOperationError("Background job state changed concurrently");
    await tx.insert(auditLogs).values({
      actorUserId: actor.id,
      action: `job.${input.action === "retry" ? "retried" : "cancelled"}`,
      entityType: "background_job",
      entityId: jobId,
      requestId: context.requestId?.slice(0, 128),
      ipAddress: context.clientIp?.slice(0, 64),
      metadata: { type: current.type, before: { status: current.status, attempts: current.attempts }, after: { status: updated.status, attempts: updated.attempts } }
    });
    return updated;
  });
}
