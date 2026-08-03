import { NextResponse } from "next/server";

import { adminRouteErrorResponse, authorizeAdminRequest } from "@/lib/admin/api";
import {
  adminWorkspaceCreateSchema,
  createWorkspaceByAdmin,
  listAdminWorkspaces,
  parseAdminWorkspaceQuery
} from "@/lib/admin/workspaces";
import { readJsonBody } from "@/lib/observability/http";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-workspaces" });
  if (!auth.ok) return auth.response;
  try {
    return NextResponse.json(await listAdminWorkspaces(parseAdminWorkspaceQuery(new URL(request.url).searchParams)));
  } catch (error) {
    const response = adminRouteErrorResponse(error);
    if (response) return response;
    throw error;
  }
}

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-workspace-create", limit: 30, mutation: true });
  if (!auth.ok) return auth.response;
  try {
    const input = adminWorkspaceCreateSchema.parse(await readJsonBody(request, 8_192));
    const workspace = await createWorkspaceByAdmin(auth.actor, input, auth);
    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    const response = adminRouteErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
