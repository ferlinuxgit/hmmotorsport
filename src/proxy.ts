import { NextRequest, NextResponse } from "next/server";

import { REQUEST_ID_HEADER, getSecurityHeaders, resolveRequestId } from "@/lib/observability/http";

const protectedRouteMatchers = [/^\/dashboard(\/.*)?$/, /^\/account(\/.*)?$/, /^\/admin(\/.*)?$/, /^\/api\/account(\/.*)?$/, /^\/api\/admin(\/.*)?$/];

function isProtectedRoute(pathname: string) {
  return protectedRouteMatchers.some((matcher) => matcher.test(pathname));
}

function hasAuthCookie(req: NextRequest) {
  return req.cookies.has("better-auth.session_token") || req.cookies.has("better-auth-session_token");
}

function secureResponse(response: NextResponse, requestId: string) {
  response.headers.set(REQUEST_ID_HEADER, requestId);

  for (const [name, value] of Object.entries(getSecurityHeaders({ isProduction: process.env.NODE_ENV === "production" }))) {
    response.headers.set(name, value);
  }

  return response;
}

export default async function proxy(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  const requestId = resolveRequestId(requestHeaders);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  if (isProtectedRoute(req.nextUrl.pathname) && !hasAuthCookie(req)) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return secureResponse(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), requestId);
    }

    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("next", req.nextUrl.pathname);
    return secureResponse(NextResponse.redirect(signInUrl), requestId);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });

  return secureResponse(response, requestId);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)"
  ]
};
