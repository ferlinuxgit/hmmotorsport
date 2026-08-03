import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

import { getAppEnv, getDatabaseEnv, getNotificationsEnv, getPaymentsEnv, getProductionReadinessIssues, getStorageEnv } from "@/lib/config/env";
import { getDb } from "@/lib/db/client";
import { backgroundJobs, notifications } from "@/lib/db/schema";
import { getEnabledPaymentProviders, getInstalledModules } from "@/lib/modules/loader";
import { getObservabilityEnv } from "@/lib/config/env";
import { getOverallHealthState, type HealthChecks } from "@/lib/observability/health";
import { logger } from "@/lib/observability/logger";
import { REQUEST_ID_HEADER, resolveRequestId } from "@/lib/observability/http";

export async function GET(request: Request) {
  const requestId = resolveRequestId(request.headers);
  const modules = getInstalledModules();
  const configurationIssues = getProductionReadinessIssues(process.env, { requiredPaymentProviders: getEnabledPaymentProviders() });
  const checks: HealthChecks = {
    app: "ok",
    configuration: configurationIssues.length > 0 ? "error" : "ok",
    database: "ok",
    payments: "ok",
    jobs: "ok",
    notifications: "ok",
    storage: "ok"
  };

  try {
    getAppEnv();
    getDatabaseEnv();
    await getDb().execute(sql`select 1`);
  } catch (error) {
    checks.database = "error";
    logger.error("Database healthcheck failed", { error, requestId });
  }

  try {
    const [operations] = await getDb().select({
      failedJobs: sql<number>`count(*) filter (where ${backgroundJobs.status} = 'failed')::int`,
      overdueJobs: sql<number>`count(*) filter (where ${backgroundJobs.status} = 'queued' and ${backgroundJobs.runAt} < now() - interval '5 minutes')::int`
    }).from(backgroundJobs);
    if ((operations?.failedJobs ?? 0) > 0 || (operations?.overdueJobs ?? 0) > 0) checks.jobs = "degraded";
  } catch (error) {
    checks.jobs = "error";
    logger.error("Jobs healthcheck failed", { error, requestId });
  }

  try {
    getNotificationsEnv();
    const [delivery] = await getDb().select({ failed: sql<number>`count(*) filter (where ${notifications.status} = 'failed')::int` }).from(notifications);
    if ((delivery?.failed ?? 0) > 0) checks.notifications = "degraded";
  } catch (error) {
    checks.notifications = "error";
    logger.error("Notifications healthcheck failed", { error, requestId });
  }

  try { getStorageEnv(); } catch (error) { checks.storage = "error"; logger.error("Storage healthcheck failed", { error, requestId }); }

  try {
    const paymentsEnv = getPaymentsEnv();
    const requiredProviders = new Set(modules.flatMap((module) => module.paymentProviders));
    const missingStripe =
      requiredProviders.has("stripe") && (!paymentsEnv.STRIPE_SECRET_KEY || !paymentsEnv.STRIPE_WEBHOOK_SECRET);
    const missingPaypal =
      requiredProviders.has("paypal") &&
      (!paymentsEnv.PAYPAL_CLIENT_ID || !paymentsEnv.PAYPAL_CLIENT_SECRET || !paymentsEnv.PAYPAL_WEBHOOK_ID);

    if (process.env.NODE_ENV === "production" && (missingStripe || missingPaypal)) {
      checks.payments = "degraded";
    }
  } catch (error) {
    checks.payments = "error";
    logger.error("Payments healthcheck failed", { error, requestId });
  }

  const status = getOverallHealthState(checks);
  const observabilityEnv = getObservabilityEnv();

  const response = NextResponse.json(
    {
      status,
      checks,
      configurationIssues,
      modules: modules.map((module) => module.key),
      deployment: observabilityEnv.DEPLOYMENT_ENV,
      buildSha: observabilityEnv.BUILD_SHA ?? null,
      timestamp: new Date().toISOString()
    },
    { status: status === "error" ? 503 : 200 }
  );

  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}
