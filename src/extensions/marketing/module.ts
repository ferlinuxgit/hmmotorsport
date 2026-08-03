import type { AppModule } from "@/lib/modules/contracts";

export const moduleDefinition: AppModule = {
  key: "marketing",
  name: "Marketing Site",
  area: "marketing",
  description: "Landing pages, contenido editable y navegación pública para sitios estáticos o híbridos.",
  navigation: [
    {
      title: "Inicio",
      href: "/",
      description: "Portada y bloques composables",
      segment: "site"
    }
  ],
  marketingSections: [
    {
      key: "marketing-seo",
      eyebrow: "SEO-ready",
      title: "Páginas de contenido con base de datos o contenido híbrido",
      description: "La estructura soporta páginas editoriales, changelogs, pricing y páginas corporativas."
    }
  ],
  dashboardCards: [
    {
      key: "marketing-content",
      title: "Gestión de contenido",
      description: "Administra páginas, bloques y secciones reutilizables para la parte pública.",
      href: "/dashboard"
    }
  ],
  dbTables: ["content_pages"],
  paymentProviders: [],
  backofficeNavigation: [
    {
      key: "marketing-analytics",
      title: "Audiencia",
      description: "Actividad y analítica de primera parte.",
      href: "/admin/content"
    }
  ],
  runtimeSettings: [
    { key: "marketing.announcement", title: "Anuncio público", description: "Mensaje breve disponible para superficies públicas.", kind: "string", defaultValue: "", public: true, max: 240 }
  ],
  featureFlags: [
    { key: "marketing.experimental_home", title: "Home experimental", description: "Activa una variante de portada para rollout gradual.", defaultEnabled: false, defaultRolloutPercentage: 0 }
  ]
};
