import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getResolvedDatabaseUrl } from "@/lib/config/env";

const globalForDb = globalThis as unknown as {
  sql?: ReturnType<typeof postgres>;
  db?: ReturnType<typeof drizzle>;
};

function getSqlClient() {
  if (globalForDb.sql) {
    return globalForDb.sql;
  }

  const sql = postgres(getResolvedDatabaseUrl(), {
    max: 10,
    prepare: false
  });

  globalForDb.sql = sql;

  return sql;
}

export function getDb() {
  if (globalForDb.db) {
    return globalForDb.db;
  }

  const db = drizzle(getSqlClient());

  globalForDb.db = db;

  return db;
}

export async function closeDb() {
  await globalForDb.sql?.end();
  delete globalForDb.sql;
  delete globalForDb.db;
}
