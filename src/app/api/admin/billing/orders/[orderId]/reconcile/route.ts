import { NextResponse } from "next/server";
import { z } from "zod";

import { adminRouteErrorResponse, authorizeAdminRequest } from "@/lib/admin/api";
import { enqueueOrderReconciliation } from "@/lib/billing/service";

export async function POST(request: Request, context: { params: Promise<{ orderId: string }> }) { const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-order-reconcile", limit: 30, mutation: true }); if (!auth.ok) return auth.response; try { const orderId = z.uuid().parse((await context.params).orderId); return NextResponse.json(await enqueueOrderReconciliation(auth.actor, orderId, auth), { status: 202 }); } catch (error) { const response = adminRouteErrorResponse(error); if (response) return response; throw error; } }
