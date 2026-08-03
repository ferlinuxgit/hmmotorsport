import { installedModules } from "@/modules/generated";

import type { AppModule, BackofficeNavItem, DashboardCard, FeatureFlagDefinition, MarketingSection, NavItem, PaymentProviderKey, RuntimeSettingDefinition } from "./contracts";

const coreRuntimeSettings: RuntimeSettingDefinition[] = [
  { key: "app.support_email", title: "Email de soporte", description: "Dirección pública mostrada por las superficies de ayuda.", kind: "string", defaultValue: "", public: true, max: 255 },
  { key: "storage.uploads_enabled", title: "Nuevas subidas", description: "Interruptor operativo para detener nuevas subidas sin afectar descargas.", kind: "boolean", defaultValue: true, public: false }
];

export function requireUniqueRegistryKeys<T extends { key: string }>(items: T[], registryName: string): T[] {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.key)) throw new Error(`Duplicate ${registryName} key: ${item.key}`);
    seen.add(item.key);
  }
  return items;
}

export function getInstalledModules(): AppModule[] {
  return requireUniqueRegistryKeys(installedModules, "module");
}

export function getSiteNavigation(): NavItem[] {
  return installedModules
    .flatMap((module) => module.navigation.filter((item) => item.segment === "site"))
    .sort((left, right) => (left.href === "/" ? -1 : right.href === "/" ? 1 : left.title.localeCompare(right.title)));
}

export function getAppNavigation(): NavItem[] {
  return installedModules.flatMap((module) => module.navigation.filter((item) => item.segment === "app"));
}

export function getMarketingSections(): MarketingSection[] {
  return installedModules.flatMap((module) => module.marketingSections);
}

export function getDashboardCards(): DashboardCard[] {
  return installedModules.flatMap((module) => module.dashboardCards);
}

export function getEnabledPaymentProviders(): PaymentProviderKey[] {
  return [...new Set(installedModules.flatMap((module) => module.paymentProviders))];
}

export function getBackofficeNavigation(): BackofficeNavItem[] {
  const items = installedModules.flatMap((module) => module.backofficeNavigation ?? []);
  return requireUniqueRegistryKeys(items, "backoffice navigation");
}

export function getRuntimeSettingDefinitions(): RuntimeSettingDefinition[] {
  const definitions = [...coreRuntimeSettings, ...installedModules.flatMap((module) => module.runtimeSettings ?? [])];
  return requireUniqueRegistryKeys(definitions, "runtime setting");
}

export function getFeatureFlagDefinitions(): FeatureFlagDefinition[] {
  const definitions = installedModules.flatMap((module) => module.featureFlags ?? []);
  return requireUniqueRegistryKeys(definitions, "feature flag");
}
