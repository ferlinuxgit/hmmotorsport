import postgres from "postgres";

function toBoolean(value, fallback = false) {
  return value ? ["1", "true", "yes", "on"].includes(value.toLowerCase()) : fallback;
}

function resolveDatabaseUrl(env) {
  if ((env.DATABASE_MODE ?? "internal") === "external") {
    if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required when DATABASE_MODE=external");
    return env.DATABASE_URL;
  }

  if (env.DATABASE_URL) return env.DATABASE_URL;
  const user = encodeURIComponent(env.POSTGRES_USER ?? "postgres");
  const password = encodeURIComponent(env.POSTGRES_PASSWORD ?? "postgres");
  const host = env.POSTGRES_HOST ?? "postgres";
  const port = env.POSTGRES_PORT ?? "5432";
  const database = env.POSTGRES_DB ?? "baseboilerplate";
  return `postgres://${user}:${password}@${host}:${port}/${database}${toBoolean(env.POSTGRES_SSL) ? "?sslmode=require" : ""}`;
}

function positiveDays(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const sql = postgres(resolveDatabaseUrl(process.env), { max: 1, prepare: false });

try {
  const sessionDays = positiveDays(process.env.SESSION_RETENTION_DAYS, 7);
  const draftDays = positiveDays(process.env.DRAFT_ORDER_RETENTION_DAYS, 7);
  const analyticsDays = positiveDays(process.env.ANALYTICS_RETENTION_DAYS, 180);
  const paymentDays = positiveDays(process.env.PAYMENT_EVENT_RETENTION_DAYS, 365);

  await sql`delete from rate_limit_buckets where reset_at < now()`;
  await sql`delete from sessions where expires_at < now() - (${sessionDays} * interval '1 day')`;
  await sql`delete from orders where status = 'draft' and created_at < now() - (${draftDays} * interval '1 day')`;
  await sql`delete from analytics_events where created_at < now() - (${analyticsDays} * interval '1 day')`;
  await sql`delete from payment_events where created_at < now() - (${paymentDays} * interval '1 day')`;
  console.log("Database maintenance completed");
} finally {
  await sql.end();
}
