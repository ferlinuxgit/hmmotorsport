export type ModuleArea = "marketing" | "commerce" | "saas" | "shared";
export type PaymentProviderKey = "stripe" | "paypal";

export interface NavItem {
  title: string;
  href: string;
  description: string;
  segment: "site" | "app";
}

export interface MarketingSection {
  key: string;
  eyebrow: string;
  title: string;
  description: string;
}

export interface DashboardCard {
  key: string;
  title: string;
  description: string;
  href: string;
}

export interface AppModule {
  key: string;
  name: string;
  area: ModuleArea;
  description: string;
  navigation: NavItem[];
  marketingSections: MarketingSection[];
  dashboardCards: DashboardCard[];
  dbTables: string[];
  paymentProviders: PaymentProviderKey[];
}

