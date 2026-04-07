function toBoolean(value: string | undefined, fallback = false) {
  if (!value) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function encodePart(value: string) {
  return encodeURIComponent(value);
}

export function resolveDatabaseUrl(env: NodeJS.ProcessEnv, options?: { allowMissing?: boolean }) {
  const mode = env.DATABASE_MODE ?? "internal";

  if (mode === "external") {
    if (!env.DATABASE_URL) {
      if (options?.allowMissing) {
        return undefined;
      }

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
