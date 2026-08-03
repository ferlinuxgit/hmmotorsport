import { NextResponse } from "next/server";
import { z } from "zod";

import { adminRouteErrorResponse, authorizeAdminRequest } from "@/lib/admin/api";
import { productUpdateSchema, updateProduct } from "@/lib/commerce/admin";
import { readJsonBody } from "@/lib/observability/http";

export async function PATCH(request: Request, context: { params: Promise<{ productId: string }> }) { const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-product-update", limit: 60, mutation: true }); if (!auth.ok) return auth.response; try { const id = z.uuid().parse((await context.params).productId); const input = productUpdateSchema.parse(await readJsonBody(request, 8_192)); return NextResponse.json({ product: await updateProduct(auth.actor, id, input, auth) }); } catch (error) { const response = adminRouteErrorResponse(error); if (response) return response; throw error; } }
