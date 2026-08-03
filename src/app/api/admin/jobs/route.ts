import { NextResponse } from "next/server";

import { adminRouteErrorResponse, authorizeAdminRequest } from "@/lib/admin/api";
import { listJobs, parseJobQuery } from "@/lib/jobs/queue";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-jobs" });
  if (!auth.ok) return auth.response;
  try {
    return NextResponse.json(await listJobs(parseJobQuery(new URL(request.url).searchParams)));
  } catch (error) {
    const response = adminRouteErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
