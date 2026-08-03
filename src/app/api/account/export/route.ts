import { accountRouteErrorResponse, authorizeAccountRequest } from "@/lib/auth/api";
import { exportAccountData } from "@/lib/account/export";

export async function GET(request: Request) {
  const auth = await authorizeAccountRequest(request, { rateLimitKey: "account-export", limit: 5 }); if (!auth.ok) return auth.response;
  try {
    const data = await exportAccountData(auth.actor);
    return new Response(JSON.stringify(data, null, 2), { headers: { "cache-control": "private, no-store", "content-disposition": `attachment; filename="account-export-${new Date().toISOString().slice(0, 10)}.json"`, "content-type": "application/json; charset=utf-8", "x-content-type-options": "nosniff" } });
  } catch (error) { const response = accountRouteErrorResponse(error); if (response) return response; throw error; }
}
