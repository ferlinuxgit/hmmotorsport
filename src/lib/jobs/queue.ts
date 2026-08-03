import { and, asc, desc, eq, ilike, lte, or, sql } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { backgroundJobAttempts, backgroundJobs } from "@/lib/db/schema";

export const jobStatusSchema = z.enum(["queued", "running", "succeeded", "failed", "cancelled"]);
export type JobStatus = z.infer<typeof jobStatusSchema>;

export const enqueueJobSchema = z.object({
  type: z.string().trim().min(3).max(120).regex(/^[a-z][a-z0-9_.-]+$/),
  payload: z.record(z.string(), z.unknown()).default({}),
  priority: z.number().int().min(0).max(1000).default(100),
  maxAttempts: z.number().int().min(1).max(25).default(5),
  runAt: z.date().default(() => new Date()),
  deduplicationKey: z.string().trim().min(1).max(255).optional()
});

const jobQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().trim().max(160).default(""),
  status: z.union([z.literal("all"), jobStatusSchema]).default("all")
});

export function parseJobQuery(params: URLSearchParams) {
  return jobQuerySchema.parse(Object.fromEntries(params));
}

export function jobInsertValues(input: z.input<typeof enqueueJobSchema>) {
  return enqueueJobSchema.parse(input);
}

export async function enqueueJob(input: z.input<typeof enqueueJobSchema>) {
  const values = jobInsertValues(input);
  const db = getDb();
  const [created] = await db.insert(backgroundJobs).values(values).onConflictDoNothing().returning();
  if (created) return { job: created, deduplicated: false };
  if (!values.deduplicationKey) throw new Error("Could not enqueue background job");
  const [existing] = await db.select().from(backgroundJobs)
    .where(eq(backgroundJobs.deduplicationKey, values.deduplicationKey)).limit(1);
  if (!existing) throw new Error("Could not resolve deduplicated background job");
  return { job: existing, deduplicated: true };
}

export async function claimNextJob(workerId: string, now = new Date()) {
  const normalizedWorkerId = z.string().trim().min(1).max(120).parse(workerId);
  const db = getDb();
  return db.transaction(async (tx) => {
    const [candidate] = await tx.select().from(backgroundJobs)
      .where(and(eq(backgroundJobs.status, "queued"), lte(backgroundJobs.runAt, now)))
      .orderBy(asc(backgroundJobs.priority), asc(backgroundJobs.runAt), asc(backgroundJobs.createdAt))
      .limit(1)
      .for("update", { skipLocked: true });
    if (!candidate) return null;
    const attempt = candidate.attempts + 1;
    const [job] = await tx.update(backgroundJobs).set({
      status: "running", attempts: attempt, lockedAt: now, lockedBy: normalizedWorkerId, updatedAt: now, lastError: null
    }).where(and(eq(backgroundJobs.id, candidate.id), eq(backgroundJobs.status, "queued"))).returning();
    if (!job) return null;
    const [attemptRecord] = await tx.insert(backgroundJobAttempts).values({
      jobId: job.id, attempt, workerId: normalizedWorkerId, status: "running", startedAt: now
    }).returning({ id: backgroundJobAttempts.id });
    if (!attemptRecord) throw new Error("Could not create job attempt");
    return { job, attemptId: attemptRecord.id };
  });
}

export async function completeJob(jobId: string, attemptId: string, workerId: string, now = new Date()) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const [job] = await tx.update(backgroundJobs).set({
      status: "succeeded", completedAt: now, lockedAt: null, lockedBy: null, updatedAt: now
    }).where(and(eq(backgroundJobs.id, jobId), eq(backgroundJobs.status, "running"), eq(backgroundJobs.lockedBy, workerId))).returning();
    if (!job) throw new Error("Running job lock was lost before completion");
    await tx.update(backgroundJobAttempts).set({ status: "succeeded", finishedAt: now })
      .where(and(eq(backgroundJobAttempts.id, attemptId), eq(backgroundJobAttempts.jobId, jobId)));
    return job;
  });
}

function retryDelayMs(attempt: number) {
  return Math.min(60_000 * 2 ** Math.max(attempt - 1, 0), 6 * 60 * 60 * 1000);
}

function errorMessage(error: unknown) {
  return (error instanceof Error ? `${error.name}: ${error.message}` : String(error)).slice(0, 4_000);
}

export async function failJob(jobId: string, attemptId: string, workerId: string, error: unknown, now = new Date()) {
  const db = getDb();
  const message = errorMessage(error);
  return db.transaction(async (tx) => {
    const [current] = await tx.select().from(backgroundJobs)
      .where(and(eq(backgroundJobs.id, jobId), eq(backgroundJobs.status, "running"), eq(backgroundJobs.lockedBy, workerId)))
      .limit(1).for("update");
    if (!current) throw new Error("Running job lock was lost before failure handling");
    const terminal = current.attempts >= current.maxAttempts;
    const [job] = await tx.update(backgroundJobs).set({
      status: terminal ? "failed" : "queued",
      runAt: terminal ? current.runAt : new Date(now.getTime() + retryDelayMs(current.attempts)),
      lockedAt: null, lockedBy: null, lastError: message, completedAt: terminal ? now : null, updatedAt: now
    }).where(eq(backgroundJobs.id, jobId)).returning();
    await tx.update(backgroundJobAttempts).set({ status: "failed", error: message, finishedAt: now })
      .where(and(eq(backgroundJobAttempts.id, attemptId), eq(backgroundJobAttempts.jobId, jobId)));
    return job;
  });
}

export async function recoverStaleJobs(staleAfterMs = 15 * 60_000, now = new Date()) {
  const cutoff = new Date(now.getTime() - staleAfterMs);
  const db = getDb();
  const stale = await db.select({ id: backgroundJobs.id, attempts: backgroundJobs.attempts, maxAttempts: backgroundJobs.maxAttempts })
    .from(backgroundJobs).where(and(eq(backgroundJobs.status, "running"), lte(backgroundJobs.lockedAt, cutoff))).limit(100);
  for (const job of stale) {
    const terminal = job.attempts >= job.maxAttempts;
    await db.transaction(async (tx) => {
      await tx.update(backgroundJobs).set({
        status: terminal ? "failed" : "queued", runAt: now, lockedAt: null, lockedBy: null,
        lastError: "Job lock expired before completion", completedAt: terminal ? now : null, updatedAt: now
      }).where(and(eq(backgroundJobs.id, job.id), eq(backgroundJobs.status, "running"), lte(backgroundJobs.lockedAt, cutoff)));
      await tx.update(backgroundJobAttempts).set({ status: "failed", error: "Job lock expired before completion", finishedAt: now })
        .where(and(eq(backgroundJobAttempts.jobId, job.id), eq(backgroundJobAttempts.status, "running")));
    });
  }
  return stale.length;
}

export async function listJobs(query: z.infer<typeof jobQuerySchema>) {
  const db = getDb();
  const conditions = [];
  if (query.q) {
    const pattern = `%${query.q.replace(/[\\%_]/g, "\\$&")}%`;
    conditions.push(or(ilike(backgroundJobs.type, pattern), ilike(backgroundJobs.deduplicationKey, pattern)));
  }
  if (query.status !== "all") conditions.push(eq(backgroundJobs.status, query.status));
  const where = conditions.length ? and(...conditions) : undefined;
  const [[count], items] = await Promise.all([
    db.select({ total: sql<number>`count(*)::int` }).from(backgroundJobs).where(where),
    db.select().from(backgroundJobs).where(where).orderBy(desc(backgroundJobs.createdAt)).limit(query.pageSize).offset((query.page - 1) * query.pageSize)
  ]);
  const total = count?.total ?? 0;
  return { items, pagination: { page: query.page, pageSize: query.pageSize, total, pages: Math.max(Math.ceil(total / query.pageSize), 1) } };
}

export async function retryJob(jobId: string) {
  const [job] = await getDb().update(backgroundJobs).set({
    status: "queued", attempts: 0, runAt: new Date(), lockedAt: null, lockedBy: null, lastError: null, completedAt: null, updatedAt: new Date()
  }).where(and(eq(backgroundJobs.id, jobId), or(eq(backgroundJobs.status, "failed"), eq(backgroundJobs.status, "cancelled")))).returning();
  if (!job) throw new Error("Only failed or cancelled jobs can be retried");
  return job;
}

export async function cancelJob(jobId: string) {
  const [job] = await getDb().update(backgroundJobs).set({ status: "cancelled", completedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(backgroundJobs.id, jobId), eq(backgroundJobs.status, "queued"))).returning();
  if (!job) throw new Error("Only queued jobs can be cancelled");
  return job;
}
