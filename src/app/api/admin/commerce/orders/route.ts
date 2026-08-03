import { NextResponse } from "next/server";

import { adminRouteErrorResponse, authorizeAdminRequest } from "@/lib/admin/api";
import { listOrders, parseOrderQuery } from "@/lib/commerce/admin";

export async function GET(request: Request) { const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-orders" }); if (!auth.ok) return auth.response; try { return NextResponse.json(await listOrders(parseOrderQuery(new URL(request.url).searchParams))); } catch (error) { const response = adminRouteErrorResponse(error); if (response) return response; throw error; } }
