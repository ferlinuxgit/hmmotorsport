import { NextResponse } from "next/server";
import { z } from "zod";

import { adminRouteErrorResponse, authorizeAdminRequest } from "@/lib/admin/api";
import { revokeWorkspaceInvitation } from "@/lib/workspaces/invitations";

export async function DELETE(request: Request, context: { params: Promise<{ workspaceId: string; invitationId: string }> }) {
  const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-workspace-invitation-revoke", limit: 30, mutation: true });
  if (!auth.ok) return auth.response;
  try {
    const params = await context.params;
    const workspaceId = z.string().uuid().parse(params.workspaceId);
    const invitationId = z.string().uuid().parse(params.invitationId);
    return NextResponse.json({ invitation: await revokeWorkspaceInvitation(auth.actor, workspaceId, invitationId, auth) });
  } catch (error) {
    const response = adminRouteErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
