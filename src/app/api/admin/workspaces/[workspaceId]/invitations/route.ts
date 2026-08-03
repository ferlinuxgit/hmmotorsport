import { NextResponse } from "next/server";
import { z } from "zod";

import { adminRouteErrorResponse, authorizeAdminRequest } from "@/lib/admin/api";
import { createWorkspaceInvitation, invitationCreateSchema } from "@/lib/workspaces/invitations";
import { readJsonBody } from "@/lib/observability/http";

export async function POST(request: Request, context: { params: Promise<{ workspaceId: string }> }) {
  const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-workspace-invitation", limit: 30, mutation: true });
  if (!auth.ok) return auth.response;
  try {
    const workspaceId = z.string().uuid().parse((await context.params).workspaceId);
    const input = invitationCreateSchema.parse(await readJsonBody(request, 4_096));
    return NextResponse.json({ invitation: await createWorkspaceInvitation(auth.actor, workspaceId, input, auth) }, { status: 201 });
  } catch (error) {
    const response = adminRouteErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
