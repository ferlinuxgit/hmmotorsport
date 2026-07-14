import { NextResponse } from "next/server";

import { getObservabilityEnv } from "@/lib/config/env";
import { REQUEST_ID_HEADER, resolveRequestId } from "@/lib/observability/http";

export async function GET(request: Request) {
  const requestId = resolveRequestId(request.headers);
  const observabilityEnv = getObservabilityEnv();
  const response = NextResponse.json({
    status: "ok",
    deployment: observabilityEnv.DEPLOYMENT_ENV,
    buildSha: observabilityEnv.BUILD_SHA ?? null,
    timestamp: new Date().toISOString()
  });

  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}
