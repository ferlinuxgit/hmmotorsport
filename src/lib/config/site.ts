export const siteConfig = {
  name: process.env.APP_NAME ?? "Universal Boilerplate",
  description:
    process.env.APP_DESCRIPTION ??
    "Next.js boilerplate universal con frontend, backend, PostgreSQL, Drizzle, Better Auth, Stripe y PayPal.",
  url: process.env.APP_URL ?? "http://localhost:3000",
  locale: "es_ES"
};

export function getSiteUrl() {
  return new URL(siteConfig.url);
}
