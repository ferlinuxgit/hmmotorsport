import { NextResponse } from "next/server";
import { z } from "zod";

import { accountRouteErrorResponse, authorizeAccountRequest } from "@/lib/auth/api";
import { getStorageEnv } from "@/lib/config/env";
import { readBinaryBody } from "@/lib/observability/http";
import { readFileAsset, storeFileBytes } from "@/lib/storage/service";

export const runtime = "nodejs";

function contentDisposition(filename: string) {
  const fallback = filename.replace(/[^a-zA-Z0-9._ -]/g, "_").replaceAll('"', "_") || "file";
  return `inline; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function GET(request: Request, context: { params: Promise<{ fileId: string }> }) {
  const auth = await authorizeAccountRequest(request, { rateLimitKey: "files-download", limit: 240 });
  if (!auth.ok) return auth.response;
  try {
    const id = z.uuid().parse((await context.params).fileId);
    const { asset, bytes } = await readFileAsset(auth.actor, id);
    return new Response(Buffer.from(bytes), {
      headers: {
        "cache-control": "private, no-store",
        "content-disposition": contentDisposition(asset.originalName),
        "content-length": String(bytes.byteLength),
        "content-type": asset.mimeType,
        "x-content-type-options": "nosniff"
      }
    });
  } catch (error) {
    const response = accountRouteErrorResponse(error);
    if (response) return response;
    throw error;
  }
}

export async function PUT(request: Request, context: { params: Promise<{ fileId: string }> }) {
  const auth = await authorizeAccountRequest(request, { rateLimitKey: "files-upload", limit: 30, mutation: true });
  if (!auth.ok) return auth.response;
  try {
    const id = z.uuid().parse((await context.params).fileId);
    const mimeType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
    if (!mimeType) return NextResponse.json({ error: "Content-Type is required" }, { status: 400 });
    const bytes = await readBinaryBody(request, getStorageEnv().STORAGE_MAX_FILE_BYTES);
    return NextResponse.json({ file: await storeFileBytes(auth.actor, id, bytes, mimeType, auth) });
  } catch (error) {
    const response = accountRouteErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
