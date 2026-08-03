import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { getJobsEnv } from "@/lib/config/env";
import { runJobBatch } from "@/lib/jobs/runner";
import { enqueueJob } from "@/lib/jobs/queue";

function validSecret(provided: string | null, expected: string) {
  if (!provided) return false;
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  const env = getJobsEnv();
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? request.headers.get("x-job-secret");
  if (!validSecret(provided, env.JOB_RUNNER_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const reconciliationBucket = Math.floor(Date.now() / 300_000);
  await enqueueJob({ type: "billing.reconcile_pending_orders", payload: {}, deduplicationKey: `billing-reconcile-sweep:${reconciliationBucket}`, maxAttempts: 3, priority: 80 });
  return NextResponse.json(await runJobBatch({ batchSize: env.JOB_BATCH_SIZE }));
}
