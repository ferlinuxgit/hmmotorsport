import { NextResponse } from "next/server";

import { adminRouteErrorResponse, authorizeAdminRequest } from "@/lib/admin/api";
import { listRuntimeConfiguration } from "@/lib/config/runtime";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-configuration" });
  if (!auth.ok) return auth.response;
  try {
    return NextResponse.json(await listRuntimeConfiguration());
  } catch (error) {
    const response = adminRouteErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
