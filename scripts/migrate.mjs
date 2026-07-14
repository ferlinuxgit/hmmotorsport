import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

function toBoolean(value, fallback = false) {
  if (!value) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function encodePart(value) {
  return encodeURIComponent(value);
}

function resolveDatabaseUrl(env) {
  const mode = env.DATABASE_MODE ?? "internal";

  if (mode === "external") {
    if (!env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required when DATABASE_MODE=external");
    }

    return env.DATABASE_URL;
  }

  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }

  const host = env.POSTGRES_HOST ?? "postgres";
  const port = env.POSTGRES_PORT ?? "5432";
  const database = env.POSTGRES_DB ?? "baseboilerplate";
  const user = env.POSTGRES_USER ?? "postgres";
  const password = env.POSTGRES_PASSWORD ?? "postgres";
  const ssl = toBoolean(env.POSTGRES_SSL, false);

  return `postgres://${encodePart(user)}:${encodePart(password)}@${host}:${port}/${database}${ssl ? "?sslmode=require" : ""}`;
}

const connection = postgres(resolveDatabaseUrl(process.env), {
  max: 1,
  prepare: false
});

try {
  await migrate(drizzle(connection), { migrationsFolder: "drizzle" });
  console.log("Database migrations applied");
} finally {
  await connection.end();
}
