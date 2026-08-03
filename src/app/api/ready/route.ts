import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getProductionReadinessIssues } from "@/lib/config/env";
import { getDb } from "@/lib/db/client";
import { REQUEST_ID_HEADER, resolveRequestId } from "@/lib/observability/http";
import { getEnabledPaymentProviders } from "@/lib/modules/loader";

export async function GET(request: Request) {
  const requestId = resolveRequestId(request.headers);
  const configurationIssues = getProductionReadinessIssues(process.env, { requiredPaymentProviders: getEnabledPaymentProviders() });
  let database = true;
  try { await getDb().execute(sql`select 1`); } catch { database = false; }
  const ready = database && configurationIssues.length === 0;
  const response = NextResponse.json({ status: ready ? "ready" : "not_ready", checks: { database, configuration: configurationIssues.length === 0 }, configurationIssues, timestamp: new Date().toISOString() }, { status: ready ? 200 : 503 });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}
