export const siteConfig = {
  name: process.env.APP_NAME ?? "HM Motorsport",
  description:
    process.env.APP_DESCRIPTION ??
    "Electrónica y mecánica de alto rendimiento: calibración ECU, cableado motorsport, preparación, fabricación y asistencia en pista.",
  url: process.env.APP_URL ?? "http://localhost:3000",
  locale: "es_ES"
};

export function getSiteUrl() {
  return new URL(siteConfig.url);
}
