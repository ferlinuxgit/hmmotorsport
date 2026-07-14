import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

import { getObservabilityEnv } from "@/lib/config/env";
import { getDb } from "@/lib/db/client";
import { rateLimitBuckets } from "@/lib/db/schema";

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const globalRateLimitStore = globalThis as unknown as {
  rateLimitStore?: Map<string, RateLimitEntry>;
};

function getStore() {
  if (!globalRateLimitStore.rateLimitStore) {
    globalRateLimitStore.rateLimitStore = new Map();
  }

  return globalRateLimitStore.rateLimitStore;
}

export function checkRateLimit({ key, limit, windowMs, now = Date.now() }: RateLimitOptions): RateLimitResult {
  const store = getStore();
  if (store.size > 10_000) {
    for (const [entryKey, entry] of store) {
      if (entry.resetAt <= now) {
        store.delete(entryKey);
      }
    }
  }
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });

    return {
      allowed: true,
      limit,
      remaining: Math.max(limit - 1, 0),
      resetAt
    };
  }

  existing.count += 1;

  return {
    allowed: existing.count <= limit,
    limit,
    remaining: Math.max(limit - existing.count, 0),
    resetAt: existing.resetAt
  };
}

export async function checkDistributedRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  if (getObservabilityEnv().RATE_LIMIT_BACKEND === "memory") {
    return checkRateLimit(options);
  }

  const now = new Date(options.now ?? Date.now());
  const resetAt = new Date(now.getTime() + options.windowMs);
  const [bucket] = await getDb()
    .insert(rateLimitBuckets)
    .values({ key: options.key.slice(0, 255), count: 1, resetAt, updatedAt: now })
    .onConflictDoUpdate({
      target: rateLimitBuckets.key,
      set: {
        count: sql`case when ${rateLimitBuckets.resetAt} <= ${now.toISOString()}::timestamptz then 1 else ${rateLimitBuckets.count} + 1 end`,
        resetAt: sql`case when ${rateLimitBuckets.resetAt} <= ${now.toISOString()}::timestamptz then ${resetAt.toISOString()}::timestamptz else ${rateLimitBuckets.resetAt} end`,
        updatedAt: now
      }
    })
    .returning({ count: rateLimitBuckets.count, resetAt: rateLimitBuckets.resetAt });

  const count = bucket?.count ?? options.limit + 1;
  return {
    allowed: count <= options.limit,
    limit: options.limit,
    remaining: Math.max(options.limit - count, 0),
    resetAt: bucket?.resetAt.getTime() ?? resetAt.getTime()
  };
}

function normalizeIp(value: string | null) {
  const candidate = value?.split(",")[0]?.trim();
  return candidate && candidate.length <= 64 && /^[0-9a-f:.]+$/i.test(candidate) ? candidate : null;
}

export function getClientIp(headers: Headers, options?: { trustProxyHeaders?: boolean }) {
  const trustProxyHeaders = options?.trustProxyHeaders ?? getObservabilityEnv().TRUST_PROXY_HEADERS;

  if (!trustProxyHeaders) {
    return "untrusted-proxy";
  }

  return normalizeIp(headers.get("cf-connecting-ip")) ?? normalizeIp(headers.get("x-real-ip")) ?? normalizeIp(headers.get("x-forwarded-for")) ?? "unknown";
}

export function applyRateLimitHeaders(response: NextResponse, result: RateLimitResult) {
  response.headers.set("X-RateLimit-Limit", result.limit.toString());
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  response.headers.set("X-RateLimit-Reset", Math.ceil(result.resetAt / 1000).toString());
  return response;
}

export function rateLimitResponse(result: RateLimitResult) {
  const response = NextResponse.json(
    {
      error: "Too many requests"
    },
    { status: 429 }
  );
  response.headers.set("Retry-After", Math.max(Math.ceil((result.resetAt - Date.now()) / 1000), 1).toString());
  return applyRateLimitHeaders(response, result);
}
