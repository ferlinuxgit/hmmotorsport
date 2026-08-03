import { randomUUID } from "node:crypto";

export const REQUEST_ID_HEADER = "x-request-id";

export function createRequestId() {
  return randomUUID();
}

export function resolveRequestId(headers: Headers | Record<string, string | null | undefined>) {
  if (headers instanceof Headers) {
    return headers.get(REQUEST_ID_HEADER) ?? createRequestId();
  }

  return headers[REQUEST_ID_HEADER] ?? createRequestId();
}

export async function readJsonBody(request: Request, maxBytes: number): Promise<unknown> {
  if (!request.body) {
    throw new Error("Request body is required");
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;
    bytes += value.byteLength;

    if (bytes > maxBytes) {
      await reader.cancel();
      throw new Error("Request body is too large");
    }

    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();
  return JSON.parse(text);
}

export async function readBinaryBody(request: Request, maxBytes: number): Promise<Uint8Array> {
  if (!request.body) throw new Error("Request body is required");
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) throw new Error("Request body is too large");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      await reader.cancel();
      throw new Error("Request body is too large");
    }
    chunks.push(value);
  }
  const result = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

export async function readTextBody(request: Request, maxBytes: number) {
  return new TextDecoder().decode(await readBinaryBody(request, maxBytes));
}

export function isSameOriginRequest(request: Request, allowedOrigins: string[] = []) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return false;
  }

  try {
    const normalizedOrigin = new URL(origin).origin;
    const requestOrigin = new URL(request.url).origin;
    const normalizedAllowedOrigins = allowedOrigins.map((value) => new URL(value).origin);
    return normalizedOrigin === requestOrigin || normalizedAllowedOrigins.includes(normalizedOrigin);
  } catch {
    return false;
  }
}

export function getSecurityHeaders(options?: { isProduction?: boolean }) {
  const scriptPolicy = options?.isProduction ? "script-src 'self' 'unsafe-inline'" : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
  const contentSecurityPolicy = [
    "default-src 'self'",
    scriptPolicy,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(options?.isProduction ? ["upgrade-insecure-requests"] : [])
  ].join("; ");
  const headers: Record<string, string> = {
    "Content-Security-Policy": contentSecurityPolicy,
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-DNS-Prefetch-Control": "off",
    "X-Frame-Options": "DENY"
  };

  if (options?.isProduction) {
    headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload";
  }

  return headers;
}
