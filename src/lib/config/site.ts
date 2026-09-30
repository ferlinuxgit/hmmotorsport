export const siteConfig = {
  name: process.env.APP_NAME ?? "HM Motorsport",
  description:
    process.env.APP_DESCRIPTION ??
    "Electrónica y mecánica de alto rendimiento: calibración ECU, cableado motorsport, preparación, fabricación y asistencia en pista.",
  // Las páginas públicas se prerenderizan en build: si APP_URL no llega al build,
  // canonical, Open Graph, sitemap y robots deben seguir apuntando al dominio real.
  url: process.env.APP_URL || "https://hmmotorsport.es",
  locale: "es_ES"
};

export function getSiteUrl() {
  return new URL(siteConfig.url);
}
