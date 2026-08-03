import { NextResponse } from "next/server";
import { z } from "zod";

import { adminRouteErrorResponse, authorizeAdminRequest } from "@/lib/admin/api";
import { refundRequestSchema, requestRefund } from "@/lib/billing/service";
import { readJsonBody } from "@/lib/observability/http";

export async function POST(request: Request, context: { params: Promise<{ orderId: string }> }) { const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-refund-request", limit: 20, mutation: true }); if (!auth.ok) return auth.response; try { const orderId = z.uuid().parse((await context.params).orderId); const input = refundRequestSchema.parse(await readJsonBody(request, 2_048)); return NextResponse.json({ refund: await requestRefund(auth.actor, orderId, input, auth) }, { status: 202 }); } catch (error) { const response = adminRouteErrorResponse(error); if (response) return response; throw error; } }
