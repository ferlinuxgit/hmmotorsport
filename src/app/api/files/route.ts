import { NextResponse } from "next/server";
import { z } from "zod";

import { accountRouteErrorResponse, authorizeAccountRequest } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/observability/http";
import { createFileAsset, createFileSchema, listOwnFiles, listWorkspaceFiles } from "@/lib/storage/service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await authorizeAccountRequest(request, { rateLimitKey: "files-list" });
  if (!auth.ok) return auth.response;
  try {
    const workspaceId = z.uuid().optional().parse(new URL(request.url).searchParams.get("workspaceId") ?? undefined);
    const files = workspaceId ? await listWorkspaceFiles(auth.actor, workspaceId) : await listOwnFiles(auth.actor);
    return NextResponse.json({ files });
  } catch (error) {
    const response = accountRouteErrorResponse(error);
    if (response) return response;
    throw error;
  }
}

export async function POST(request: Request) {
  const auth = await authorizeAccountRequest(request, { rateLimitKey: "files-create", limit: 60, mutation: true });
  if (!auth.ok) return auth.response;
  try {
    const input = createFileSchema.parse(await readJsonBody(request, 4_096));
    const file = await createFileAsset(auth.actor, input, auth);
    return NextResponse.json({ file, uploadUrl: `/api/files/${file.id}/content` }, { status: 201 });
  } catch (error) {
    const response = accountRouteErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
