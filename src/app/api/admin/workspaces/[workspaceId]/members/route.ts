import { NextResponse } from "next/server";
import { z } from "zod";

import { adminRouteErrorResponse, authorizeAdminRequest } from "@/lib/admin/api";
import { addWorkspaceMemberByAdmin, adminWorkspaceMemberCreateSchema } from "@/lib/admin/workspaces";
import { readJsonBody } from "@/lib/observability/http";

const idSchema = z.string().uuid();

export async function POST(request: Request, context: { params: Promise<{ workspaceId: string }> }) {
  const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-workspace-member-create", limit: 60, mutation: true });
  if (!auth.ok) return auth.response;
  try {
    const workspaceId = idSchema.parse((await context.params).workspaceId);
    const input = adminWorkspaceMemberCreateSchema.parse(await readJsonBody(request, 8_192));
    const member = await addWorkspaceMemberByAdmin(auth.actor, workspaceId, input, auth);
    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    const response = adminRouteErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
