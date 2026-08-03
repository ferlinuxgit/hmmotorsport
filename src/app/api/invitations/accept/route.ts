import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { requireAccount } from "@/lib/auth/rbac";
import { isSameOriginRequest, readJsonBody } from "@/lib/observability/http";
import { checkDistributedRateLimit, getClientIp, rateLimitResponse } from "@/lib/observability/rate-limit";
import { acceptWorkspaceInvitation, InvitationOperationError } from "@/lib/workspaces/invitations";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request, process.env.APP_URL ? [process.env.APP_URL] : [])) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const rate = await checkDistributedRateLimit({ key: `invitation-accept:${getClientIp(request.headers)}`, limit: 20, windowMs: 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate);
  try {
    const account = await requireAccount();
    const { token } = z.object({ token: z.string().min(40).max(200) }).parse(await readJsonBody(request, 2_048));
    return NextResponse.json(await acceptWorkspaceInvitation(account, token));
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid invitation" }, { status: 400 });
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    if (error instanceof Error && error.message === "Request body is too large") {
      return NextResponse.json({ error: "Request body is too large" }, { status: 400 });
    }
    if (error instanceof InvitationOperationError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw error;
  }
}
