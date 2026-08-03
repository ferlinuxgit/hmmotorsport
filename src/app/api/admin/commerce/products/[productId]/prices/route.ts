import { NextResponse } from "next/server";
import { z } from "zod";

import { adminRouteErrorResponse, authorizeAdminRequest } from "@/lib/admin/api";
import { createPrice, priceCreateSchema } from "@/lib/commerce/admin";
import { readJsonBody } from "@/lib/observability/http";

export async function POST(request: Request, context: { params: Promise<{ productId: string }> }) { const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-price-create", limit: 60, mutation: true }); if (!auth.ok) return auth.response; try { const productId = z.uuid().parse((await context.params).productId); const input = priceCreateSchema.parse(await readJsonBody(request, 4_096)); return NextResponse.json({ price: await createPrice(auth.actor, productId, input, auth) }, { status: 201 }); } catch (error) { const response = adminRouteErrorResponse(error); if (response) return response; throw error; } }
