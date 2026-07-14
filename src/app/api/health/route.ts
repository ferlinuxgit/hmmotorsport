import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

import { getAppEnv, getDatabaseEnv, getPaymentsEnv, getProductionReadinessIssues } from "@/lib/config/env";
import { getDb } from "@/lib/db/client";
import { getInstalledModules } from "@/lib/modules/loader";
import { getObservabilityEnv } from "@/lib/config/env";
import { getOverallHealthState, type HealthChecks } from "@/lib/observability/health";
import { logger } from "@/lib/observability/logger";
import { REQUEST_ID_HEADER, resolveRequestId } from "@/lib/observability/http";

export async function GET(request: Request) {
  const requestId = resolveRequestId(request.headers);
  const modules = getInstalledModules();
  const configurationIssues = getProductionReadinessIssues();
  const checks: HealthChecks = {
    app: "ok",
    configuration: configurationIssues.length > 0 ? "error" : "ok",
    database: "ok",
    payments: "ok"
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
    { status: status === "ok" ? 200 : 503 }
  );

  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}
