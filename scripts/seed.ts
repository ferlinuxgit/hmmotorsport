import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { resolveDatabaseUrl } from "../src/lib/config/database";
import { prices, products } from "../src/lib/db/schema";

const databaseUrl = resolveDatabaseUrl(process.env, { allowMissing: true });

if (!databaseUrl) {
  throw new Error("DATABASE_URL could not be resolved for seed");
}

const sql = postgres(databaseUrl, { max: 1, prepare: false });
const db = drizzle(sql);

const [starterProduct] = await db
  .insert(products)
  .values({
    slug: "starter-plan",
    name: "Starter Plan",
    description: "Plan base para validar checkout y billing."
  })
  .onConflictDoUpdate({
    target: products.slug,
    set: {
      name: "Starter Plan",
      description: "Plan base para validar checkout y billing.",
      active: true
    }
  })
  .returning({ id: products.id });

await db
  .insert(prices)
  .values([
    {
      productId: starterProduct.id,
      provider: "stripe",
      amount: "19.00",
      currency: "USD",
      externalId: "seed_starter_monthly_stripe"
    },
    {
      productId: starterProduct.id,
      provider: "paypal",
      amount: "19.00",
      currency: "USD",
      externalId: "seed_starter_monthly_paypal"
    }
  ])
  .onConflictDoNothing();

await sql.end();
console.log("Seeded starter product and payment prices");
