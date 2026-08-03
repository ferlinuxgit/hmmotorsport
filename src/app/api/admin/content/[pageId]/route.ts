import { NextResponse } from "next/server";
import { z } from "zod";

import { adminRouteErrorResponse, authorizeAdminRequest } from "@/lib/admin/api";
import { contentPageUpdateSchema, getContentPage, updateContentPage } from "@/lib/content/admin";
import { readJsonBody } from "@/lib/observability/http";

export async function GET(request: Request, context: { params: Promise<{ pageId: string }> }) {
  const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-content-detail" });
  if (!auth.ok) return auth.response;
  try { return NextResponse.json({ page: await getContentPage(z.uuid().parse((await context.params).pageId)) }); }
  catch (error) { const response = adminRouteErrorResponse(error); if (response) return response; throw error; }
}

export async function PATCH(request: Request, context: { params: Promise<{ pageId: string }> }) {
  const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-content-update", limit: 60, mutation: true });
  if (!auth.ok) return auth.response;
  try {
    const id = z.uuid().parse((await context.params).pageId);
    const input = contentPageUpdateSchema.parse(await readJsonBody(request, 210_000));
    return NextResponse.json({ page: await updateContentPage(auth.actor, id, input, auth) });
  } catch (error) { const response = adminRouteErrorResponse(error); if (response) return response; throw error; }
}
