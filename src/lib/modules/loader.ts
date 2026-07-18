import { installedModules } from "@/modules/generated";

import type { AppModule, DashboardCard, MarketingSection, NavItem, PaymentProviderKey } from "./contracts";

export function getInstalledModules(): AppModule[] {
  return installedModules;
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
