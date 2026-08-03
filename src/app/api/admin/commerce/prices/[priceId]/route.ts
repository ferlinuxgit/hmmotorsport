import { NextResponse } from "next/server";
import { z } from "zod";

import { adminRouteErrorResponse, authorizeAdminRequest } from "@/lib/admin/api";
import { priceUpdateSchema, updatePrice } from "@/lib/commerce/admin";
import { readJsonBody } from "@/lib/observability/http";

export async function PATCH(request: Request, context: { params: Promise<{ priceId: string }> }) { const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-price-update", limit: 60, mutation: true }); if (!auth.ok) return auth.response; try { const id = z.uuid().parse((await context.params).priceId); const input = priceUpdateSchema.parse(await readJsonBody(request, 1_024)); return NextResponse.json({ price: await updatePrice(auth.actor, id, input, auth) }); } catch (error) { const response = adminRouteErrorResponse(error); if (response) return response; throw error; } }
