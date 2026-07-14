import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";

import { getBetterAuthEnv } from "@/lib/config/env";
import { getDb } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";

function getTrustedOrigins(appUrl: string, trustedOrigins?: string) {
  const origins = new Set([appUrl]);

  for (const origin of trustedOrigins?.split(",").map((value) => value.trim()).filter(Boolean) ?? []) {
    origins.add(origin);
  }

  return [...origins];
}

function createAuth() {
  const authEnv = getBetterAuthEnv();

  return betterAuth({
    secret: authEnv.BETTER_AUTH_SECRET,
    baseURL: authEnv.BETTER_AUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000",
    trustedOrigins: getTrustedOrigins(process.env.APP_URL ?? "http://localhost:3000", authEnv.BETTER_AUTH_TRUSTED_ORIGINS),
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema,
      usePlural: true
    }),
    advanced: {
      database: {
        generateId: false
      }
    },
    user: {
      fields: {
        image: "imageUrl"
      }
    },
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      minPasswordLength: 8
    },
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            const [user] = await getDb()
              .select({ active: schema.users.active })
              .from(schema.users)
              .where(eq(schema.users.id, session.userId))
              .limit(1);

            if (user && !user.active) {
              throw new APIError("FORBIDDEN", { message: "Account is inactive" });
            }

            return { data: session };
          }
        }
      }
    },
    plugins: [nextCookies()]
  });
}

type AppAuth = ReturnType<typeof createAuth>;

let cachedAuth: AppAuth | undefined;

export function isBetterAuthConfigured() {
  return typeof process.env.BETTER_AUTH_SECRET === "string" && process.env.BETTER_AUTH_SECRET.length >= 32;
}

export function getAuth(): AppAuth {
  if (!cachedAuth) {
    cachedAuth = createAuth();
  }

  return cachedAuth;
}
