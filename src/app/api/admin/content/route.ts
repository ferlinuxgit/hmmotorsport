import { NextResponse } from "next/server";

import { adminRouteErrorResponse, authorizeAdminRequest } from "@/lib/admin/api";
import { contentPageCreateSchema, createContentPage, listContentPages, parseContentPageQuery } from "@/lib/content/admin";
import { readJsonBody } from "@/lib/observability/http";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-content" });
  if (!auth.ok) return auth.response;
  try { return NextResponse.json(await listContentPages(parseContentPageQuery(new URL(request.url).searchParams))); }
  catch (error) { const response = adminRouteErrorResponse(error); if (response) return response; throw error; }
}

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-content-create", limit: 30, mutation: true });
  if (!auth.ok) return auth.response;
  try {
    const input = contentPageCreateSchema.parse(await readJsonBody(request, 210_000));
    return NextResponse.json({ page: await createContentPage(auth.actor, input, auth) }, { status: 201 });
  } catch (error) { const response = adminRouteErrorResponse(error); if (response) return response; throw error; }
}
