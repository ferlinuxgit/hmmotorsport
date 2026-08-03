import { randomUUID } from "node:crypto";

import { jobHandlers } from "@/lib/jobs/handlers";
import { claimNextJob, completeJob, failJob, recoverStaleJobs } from "@/lib/jobs/queue";
import { logger } from "@/lib/observability/logger";

export async function runJobBatch(options?: { workerId?: string; batchSize?: number; staleAfterMs?: number }) {
  const workerId = options?.workerId ?? `worker-${randomUUID()}`;
  const batchSize = Math.min(Math.max(options?.batchSize ?? 10, 1), 100);
  const recovered = await recoverStaleJobs(options?.staleAfterMs);
  let succeeded = 0;
  let failed = 0;

  for (let index = 0; index < batchSize; index += 1) {
    const claimed = await claimNextJob(workerId);
    if (!claimed) break;
    const handler = jobHandlers[claimed.job.type];
    try {
      if (!handler) throw new Error(`No job handler registered for ${claimed.job.type}`);
      await handler(claimed.job.payload);
      await completeJob(claimed.job.id, claimed.attemptId, workerId);
      succeeded += 1;
      logger.info("Background job succeeded", { jobId: claimed.job.id, jobType: claimed.job.type, workerId });
    } catch (error) {
      await failJob(claimed.job.id, claimed.attemptId, workerId, error);
      failed += 1;
      logger.error("Background job failed", { error, jobId: claimed.job.id, jobType: claimed.job.type, workerId });
    }
  }

  return { workerId, recovered, processed: succeeded + failed, succeeded, failed };
}
