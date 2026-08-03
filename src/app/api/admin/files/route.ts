import { NextResponse } from "next/server";

import { adminRouteErrorResponse, authorizeAdminRequest } from "@/lib/admin/api";
import { listAdminFiles, parseAdminFileQuery } from "@/lib/storage/admin";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-files" });
  if (!auth.ok) return auth.response;
  try {
    return NextResponse.json(await listAdminFiles(parseAdminFileQuery(new URL(request.url).searchParams)));
  } catch (error) {
    const response = adminRouteErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
