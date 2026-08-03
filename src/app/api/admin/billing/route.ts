import { NextResponse } from "next/server";

import { adminRouteErrorResponse, authorizeAdminRequest } from "@/lib/admin/api";
import { listBillingOperations } from "@/lib/billing/service";

export async function GET(request: Request) { const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-billing" }); if (!auth.ok) return auth.response; try { return NextResponse.json(await listBillingOperations()); } catch (error) { const response = adminRouteErrorResponse(error); if (response) return response; throw error; } }
