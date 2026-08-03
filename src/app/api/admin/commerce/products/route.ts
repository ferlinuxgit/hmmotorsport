import { NextResponse } from "next/server";

import { adminRouteErrorResponse, authorizeAdminRequest } from "@/lib/admin/api";
import { createProduct, listProducts, parseCommerceQuery, productCreateSchema } from "@/lib/commerce/admin";
import { readJsonBody } from "@/lib/observability/http";

export async function GET(request: Request) { const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-products" }); if (!auth.ok) return auth.response; try { return NextResponse.json(await listProducts(parseCommerceQuery(new URL(request.url).searchParams))); } catch (error) { const response = adminRouteErrorResponse(error); if (response) return response; throw error; } }
export async function POST(request: Request) { const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-product-create", limit: 30, mutation: true }); if (!auth.ok) return auth.response; try { const input = productCreateSchema.parse(await readJsonBody(request, 8_192)); return NextResponse.json({ product: await createProduct(auth.actor, input, auth) }, { status: 201 }); } catch (error) { const response = adminRouteErrorResponse(error); if (response) return response; throw error; } }
