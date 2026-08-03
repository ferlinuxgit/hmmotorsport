import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

test("background jobs deduplicate, run, retry and retain audited operations", { skip: !process.env.TEST_DATABASE_URL }, async () => {
  process.env.DATABASE_MODE = "external";
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.RATE_LIMIT_BACKEND = "database";
  const [{ eq, or }, { closeDb, getDb }, schema, queue, { runJobBatch }, { manageJobByAdmin }] = await Promise.all([
    import("drizzle-orm"), import("../src/lib/db/client"), import("../src/lib/db/schema"),
    import("../src/lib/jobs/queue"), import("../src/lib/jobs/runner"), import("../src/lib/admin/jobs")
  ]);
  const db = getDb();
  const suffix = randomUUID();
  const adminId = randomUUID();
  const dedupeSuccess = `noop:${suffix}`;
  const dedupeFailure = `unknown:${suffix}`;
  let successId: string | undefined;
  let failureId: string | undefined;
  try {
    await db.insert(schema.users).values({ id: adminId, email: `${adminId}@example.test`, role: "admin" });
    const first = await queue.enqueueJob({ type: "system.noop", payload: {}, deduplicationKey: dedupeSuccess });
    const duplicate = await queue.enqueueJob({ type: "system.noop", payload: {}, deduplicationKey: dedupeSuccess });
    successId = first.job.id;
    assert.equal(duplicate.deduplicated, true);
    assert.equal(duplicate.job.id, successId);
    const successRun = await runJobBatch({ workerId: `test-${suffix}`, batchSize: 1 });
    assert.equal(successRun.succeeded, 1);

    const failed = await queue.enqueueJob({ type: "unregistered.handler", payload: {}, maxAttempts: 1, deduplicationKey: dedupeFailure });
    failureId = failed.job.id;
    const failureRun = await runJobBatch({ workerId: `test-failure-${suffix}`, batchSize: 1 });
    assert.equal(failureRun.failed, 1);
    const actor = { id: adminId, email: `${adminId}@example.test`, name: "Admin", imageUrl: null, role: "admin" as const, emailVerified: true, active: true };
    await manageJobByAdmin(actor, failureId, { action: "retry" }, { requestId: "req_jobs_test", clientIp: "127.0.0.1" });
    const [retried] = await db.select().from(schema.backgroundJobs).where(eq(schema.backgroundJobs.id, failureId));
    const [audit] = await db.select().from(schema.auditLogs).where(eq(schema.auditLogs.entityId, failureId));
    assert.equal(retried.status, "queued");
    assert.equal(retried.attempts, 0);
    assert.equal(audit.action, "job.retried");
  } finally {
    await db.delete(schema.auditLogs).where(eq(schema.auditLogs.actorUserId, adminId));
    if (successId || failureId) {
      const ids = [successId, failureId].filter((value): value is string => Boolean(value));
      if (ids.length === 2) await db.delete(schema.backgroundJobs).where(or(eq(schema.backgroundJobs.id, ids[0]), eq(schema.backgroundJobs.id, ids[1])));
      else if (ids[0]) await db.delete(schema.backgroundJobs).where(eq(schema.backgroundJobs.id, ids[0]));
    }
    await db.delete(schema.users).where(eq(schema.users.id, adminId));
    await closeDb();
  }
});
