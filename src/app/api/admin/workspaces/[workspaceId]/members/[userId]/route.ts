import { NextResponse } from "next/server";
import { z } from "zod";

import { adminRouteErrorResponse, authorizeAdminRequest } from "@/lib/admin/api";
import {
  adminWorkspaceMemberUpdateSchema,
  removeWorkspaceMemberByAdmin,
  updateWorkspaceMemberByAdmin
} from "@/lib/admin/workspaces";
import { readJsonBody } from "@/lib/observability/http";

const idSchema = z.string().uuid();

async function ids(context: { params: Promise<{ workspaceId: string; userId: string }> }) {
  const params = await context.params;
  return { workspaceId: idSchema.parse(params.workspaceId), userId: idSchema.parse(params.userId) };
}

export async function PATCH(request: Request, context: { params: Promise<{ workspaceId: string; userId: string }> }) {
  const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-workspace-member-update", limit: 60, mutation: true });
  if (!auth.ok) return auth.response;
  try {
    const { workspaceId, userId } = await ids(context);
    const input = adminWorkspaceMemberUpdateSchema.parse(await readJsonBody(request, 4_096));
    return NextResponse.json({ member: await updateWorkspaceMemberByAdmin(auth.actor, workspaceId, userId, input, auth) });
  } catch (error) {
    const response = adminRouteErrorResponse(error);
    if (response) return response;
    throw error;
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ workspaceId: string; userId: string }> }) {
  const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-workspace-member-delete", limit: 60, mutation: true });
  if (!auth.ok) return auth.response;
  try {
    const { workspaceId, userId } = await ids(context);
    return NextResponse.json({ member: await removeWorkspaceMemberByAdmin(auth.actor, workspaceId, userId, auth) });
  } catch (error) {
    const response = adminRouteErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
