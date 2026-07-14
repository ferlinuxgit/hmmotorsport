import { defineConfig } from "drizzle-kit";

import { resolveDatabaseUrl } from "./src/lib/config/database";

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: resolveDatabaseUrl(process.env, { allowMissing: true }) ?? ""
  }
});
