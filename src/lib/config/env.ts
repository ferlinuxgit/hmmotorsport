import { z } from "zod";

import { resolveDatabaseUrl } from "@/lib/config/database";

const appEnvSchema = z.object({
  APP_NAME: z.string().default("Universal Boilerplate"),
  APP_URL: z.string().url().default("http://localhost:3000")
});

const clerkEnvSchema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default("/sign-in"),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default("/sign-up"),
  NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: z.string().default("/dashboard"),
  NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: z.string().default("/dashboard")
});

const databaseEnvSchema = z.object({
  DATABASE_MODE: z.enum(["internal", "external"]).default("internal"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL could not be resolved"),
  POSTGRES_HOST: z.string().default("postgres"),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_DB: z.string().default("baseboilerplate"),
  POSTGRES_USER: z.string().default("postgres"),
  POSTGRES_PASSWORD: z.string().default("postgres"),
  POSTGRES_SSL: z.enum(["true", "false"]).default("false")
});

const paymentsEnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_ENVIRONMENT: z.enum(["sandbox", "live"]).default("sandbox")
});

export type AppEnv = z.infer<typeof appEnvSchema>;
export type ClerkEnv = z.infer<typeof clerkEnvSchema>;
export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;
export type PaymentsEnv = z.infer<typeof paymentsEnvSchema>;

let cachedAppEnv: AppEnv | undefined;
let cachedClerkEnv: ClerkEnv | undefined;
let cachedDatabaseEnv: DatabaseEnv | undefined;
let cachedPaymentsEnv: PaymentsEnv | undefined;

export function getAppEnv(): AppEnv {
  if (cachedAppEnv) {
    return cachedAppEnv;
  }

  cachedAppEnv = appEnvSchema.parse({
    APP_NAME: process.env.APP_NAME,
    APP_URL: process.env.APP_URL
  });

  return cachedAppEnv;
}

export function getClerkEnv(): ClerkEnv {
  if (cachedClerkEnv) {
    return cachedClerkEnv;
  }

  cachedClerkEnv = clerkEnvSchema.parse({
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL
  });

  return cachedClerkEnv;
}

export function getDatabaseEnv(): DatabaseEnv {
  if (cachedDatabaseEnv) {
    return cachedDatabaseEnv;
  }

  cachedDatabaseEnv = databaseEnvSchema.parse({
    DATABASE_MODE: process.env.DATABASE_MODE,
    DATABASE_URL: resolveDatabaseUrl(process.env),
    POSTGRES_HOST: process.env.POSTGRES_HOST,
    POSTGRES_PORT: process.env.POSTGRES_PORT,
    POSTGRES_DB: process.env.POSTGRES_DB,
    POSTGRES_USER: process.env.POSTGRES_USER,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
    POSTGRES_SSL: process.env.POSTGRES_SSL
  });

  return cachedDatabaseEnv;
}

export function getPaymentsEnv(): PaymentsEnv {
  if (cachedPaymentsEnv) {
    return cachedPaymentsEnv;
  }

  cachedPaymentsEnv = paymentsEnvSchema.parse({
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
    PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
    PAYPAL_ENVIRONMENT: process.env.PAYPAL_ENVIRONMENT
  });

  return cachedPaymentsEnv;
}

export function getResolvedDatabaseUrl() {
  return getDatabaseEnv().DATABASE_URL;
}
