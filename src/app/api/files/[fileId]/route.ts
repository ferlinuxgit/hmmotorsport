import { NextResponse } from "next/server";
import { z } from "zod";

import { accountRouteErrorResponse, authorizeAccountRequest } from "@/lib/auth/api";
import { deleteFileAsset } from "@/lib/storage/service";

export const runtime = "nodejs";

export async function DELETE(request: Request, context: { params: Promise<{ fileId: string }> }) {
  const auth = await authorizeAccountRequest(request, { rateLimitKey: "files-delete", limit: 60, mutation: true });
  if (!auth.ok) return auth.response;
  try {
    const id = z.uuid().parse((await context.params).fileId);
    return NextResponse.json({ file: await deleteFileAsset(auth.actor, id, auth) });
  } catch (error) {
    const response = accountRouteErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
