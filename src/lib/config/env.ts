import { z } from "zod";

import { resolveDatabaseUrl } from "@/lib/config/database";

const appEnvSchema = z.object({
  APP_NAME: z.string().default("Universal Boilerplate"),
  APP_DESCRIPTION: z
    .string()
    .default("Next.js boilerplate universal con frontend, backend, PostgreSQL, Drizzle, Better Auth, Stripe y PayPal."),
  APP_URL: z.string().url().default("http://localhost:3000")
});

const betterAuthEnvSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.string().url().optional(),
  BETTER_AUTH_TRUSTED_ORIGINS: z.string().optional(),
  AUTH_ADMIN_EMAILS: z.string().optional()
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
  PAYPAL_WEBHOOK_ID: z.string().optional(),
  PAYPAL_ENVIRONMENT: z.enum(["sandbox", "live"]).default("sandbox")
});

const observabilityEnvSchema = z.object({
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  DEPLOYMENT_ENV: z.enum(["development", "staging", "production"]).default("development"),
  BUILD_SHA: z.string().optional(),
  RATE_LIMIT_BACKEND: z.enum(["memory", "database"]).default("memory"),
  TRUST_PROXY_HEADERS: z.enum(["true", "false"]).default("false").transform((value) => value === "true")
});

const productionPlaceholderValues = new Set([
  "",
  "postgres",
  "stripe_dummy",
  "stripe_wh_dummy",
  "paypal_dummy",
  "paypal_secret_dummy",
  "paypal_wh_dummy",
  "replace-with-a-long-random-secret",
  "replace-with-a-long-random-secret-of-at-least-32-characters"
]);

export type AppEnv = z.infer<typeof appEnvSchema>;
export type BetterAuthEnv = z.infer<typeof betterAuthEnvSchema>;
export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;
export type PaymentsEnv = z.infer<typeof paymentsEnvSchema>;
export type ObservabilityEnv = z.infer<typeof observabilityEnvSchema>;

let cachedAppEnv: AppEnv | undefined;
let cachedBetterAuthEnv: BetterAuthEnv | undefined;
let cachedDatabaseEnv: DatabaseEnv | undefined;
let cachedPaymentsEnv: PaymentsEnv | undefined;
let cachedObservabilityEnv: ObservabilityEnv | undefined;

export function getAppEnv(): AppEnv {
  if (cachedAppEnv) {
    return cachedAppEnv;
  }

  cachedAppEnv = appEnvSchema.parse({
    APP_NAME: process.env.APP_NAME,
    APP_DESCRIPTION: process.env.APP_DESCRIPTION,
    APP_URL: process.env.APP_URL
  });

  return cachedAppEnv;
}

export function getBetterAuthEnv(): BetterAuthEnv {
  if (cachedBetterAuthEnv) {
    return cachedBetterAuthEnv;
  }

  cachedBetterAuthEnv = betterAuthEnvSchema.parse({
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    BETTER_AUTH_TRUSTED_ORIGINS: process.env.BETTER_AUTH_TRUSTED_ORIGINS,
    AUTH_ADMIN_EMAILS: process.env.AUTH_ADMIN_EMAILS
  });

  return cachedBetterAuthEnv;
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
    PAYPAL_WEBHOOK_ID: process.env.PAYPAL_WEBHOOK_ID,
    PAYPAL_ENVIRONMENT: process.env.PAYPAL_ENVIRONMENT
  });

  return cachedPaymentsEnv;
}

export function getObservabilityEnv(): ObservabilityEnv {
  if (cachedObservabilityEnv) {
    return cachedObservabilityEnv;
  }

  cachedObservabilityEnv = observabilityEnvSchema.parse({
    LOG_LEVEL: process.env.LOG_LEVEL,
    DEPLOYMENT_ENV: process.env.DEPLOYMENT_ENV ?? process.env.NODE_ENV,
    BUILD_SHA: process.env.BUILD_SHA,
    RATE_LIMIT_BACKEND: process.env.RATE_LIMIT_BACKEND,
    TRUST_PROXY_HEADERS: process.env.TRUST_PROXY_HEADERS
  });

  return cachedObservabilityEnv;
}

export function getResolvedDatabaseUrl() {
  return getDatabaseEnv().DATABASE_URL;
}

function isPlaceholder(value: string | undefined) {
  return !value || productionPlaceholderValues.has(value);
}

function addParseIssue(issues: string[], label: string, error: unknown) {
  if (error instanceof z.ZodError) {
    issues.push(...error.issues.map((issue) => `${label}.${issue.path.join(".")}: ${issue.message}`));
    return;
  }

  issues.push(`${label}: ${error instanceof Error ? error.message : "invalid configuration"}`);
}

export function getProductionReadinessIssues(env: NodeJS.ProcessEnv = process.env) {
  const deploymentEnv = env.DEPLOYMENT_ENV ?? env.NODE_ENV;

  if (deploymentEnv !== "production") {
    return [];
  }

  const issues: string[] = [];

  try {
    appEnvSchema.parse({
      APP_NAME: env.APP_NAME,
      APP_DESCRIPTION: env.APP_DESCRIPTION,
      APP_URL: env.APP_URL
    });
  } catch (error) {
    addParseIssue(issues, "app", error);
  }

  try {
    betterAuthEnvSchema.parse({
      BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: env.BETTER_AUTH_URL,
      BETTER_AUTH_TRUSTED_ORIGINS: env.BETTER_AUTH_TRUSTED_ORIGINS,
      AUTH_ADMIN_EMAILS: env.AUTH_ADMIN_EMAILS
    });
  } catch (error) {
    addParseIssue(issues, "auth", error);
  }

  try {
    databaseEnvSchema.parse({
      DATABASE_MODE: env.DATABASE_MODE,
      DATABASE_URL: resolveDatabaseUrl(env),
      POSTGRES_HOST: env.POSTGRES_HOST,
      POSTGRES_PORT: env.POSTGRES_PORT,
      POSTGRES_DB: env.POSTGRES_DB,
      POSTGRES_USER: env.POSTGRES_USER,
      POSTGRES_PASSWORD: env.POSTGRES_PASSWORD,
      POSTGRES_SSL: env.POSTGRES_SSL
    });
  } catch (error) {
    addParseIssue(issues, "database", error);
  }

  if (isPlaceholder(env.BETTER_AUTH_SECRET)) {
    issues.push("auth.BETTER_AUTH_SECRET must be a real production secret");
  }

  if ((env.DATABASE_MODE ?? "internal") === "internal" && isPlaceholder(env.POSTGRES_PASSWORD)) {
    issues.push("database.POSTGRES_PASSWORD must be changed for production");
  }

  if (!env.BUILD_SHA) {
    issues.push("observability.BUILD_SHA should identify the deployed revision");
  }

  if ((env.RATE_LIMIT_BACKEND ?? "memory") !== "database") {
    issues.push("observability.RATE_LIMIT_BACKEND must be database in production");
  }

  if (env.TRUST_PROXY_HEADERS !== "true") {
    issues.push("observability.TRUST_PROXY_HEADERS must be true behind the required production reverse proxy");
  }

  for (const key of [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "PAYPAL_CLIENT_ID",
    "PAYPAL_CLIENT_SECRET",
    "PAYPAL_WEBHOOK_ID"
  ] as const) {
    if (env[key] && isPlaceholder(env[key])) {
      issues.push(`payments.${key} must be a real production secret when configured`);
    }
  }

  return issues;
}
