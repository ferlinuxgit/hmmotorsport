import type { AppModule } from "@/lib/modules/contracts";

export const moduleDefinition: AppModule = {
  key: "saas",
  name: "SaaS Workspace",
  area: "saas",
  description: "Workspaces multi-tenant, miembros y base para producto SaaS con suscripciones o billing recurrente.",
  navigation: [
    {
      title: "Workspaces",
      href: "/dashboard",
      description: "Gestión de tenants y acceso",
      segment: "app"
    }
  ],
  marketingSections: [
    {
      key: "saas-multitenancy",
      eyebrow: "Workspace-first",
      title: "Modelo listo para multi-tenant desde el principio",
      description: "Usuarios, workspaces y membresías se definen en el core para evitar refactors posteriores."
    }
  ],
  dashboardCards: [
    {
      key: "saas-workspaces",
      title: "Control de tenants",
      description: "Punto de partida para permisos, planes y administración de espacios.",
      href: "/dashboard"
    }
  ],
  dbTables: ["users", "workspaces", "workspace_members"],
  paymentProviders: ["stripe"],
  backofficeNavigation: [
    {
      key: "saas-workspaces",
      title: "Tenants",
      description: "Workspaces, miembros y acceso.",
      href: "/admin/workspaces"
    }
  ],
  runtimeSettings: [
    { key: "saas.default_trial_days", title: "Días de prueba", description: "Duración predeterminada para nuevas pruebas SaaS.", kind: "integer", defaultValue: 14, public: false, min: 0, max: 365 }
  ],
  featureFlags: [
    { key: "saas.workspace_invitations", title: "Invitaciones de workspace", description: "Permite crear nuevas invitaciones por email.", defaultEnabled: true, defaultRolloutPercentage: 100 }
  ]
};
