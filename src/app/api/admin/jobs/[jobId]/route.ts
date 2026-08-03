import { NextResponse } from "next/server";
import { z } from "zod";

import { adminRouteErrorResponse, authorizeAdminRequest } from "@/lib/admin/api";
import { adminJobActionSchema, manageJobByAdmin } from "@/lib/admin/jobs";
import { readJsonBody } from "@/lib/observability/http";

export async function PATCH(request: Request, context: { params: Promise<{ jobId: string }> }) {
  const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-job-action", limit: 60, mutation: true });
  if (!auth.ok) return auth.response;
  try {
    const jobId = z.string().uuid().parse((await context.params).jobId);
    const input = adminJobActionSchema.parse(await readJsonBody(request, 2_048));
    return NextResponse.json({ job: await manageJobByAdmin(auth.actor, jobId, input, auth) });
  } catch (error) {
    const response = adminRouteErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
