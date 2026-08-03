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

export interface BackofficeNavItem {
  key: string;
  title: string;
  description: string;
  href: `/admin${string}`;
}

export interface RuntimeSettingDefinition {
  key: `${string}.${string}`;
  title: string;
  description: string;
  kind: "boolean" | "string" | "integer" | "email";
  defaultValue: boolean | string | number;
  public: boolean;
  min?: number;
  max?: number;
}

export interface FeatureFlagDefinition {
  key: `${string}.${string}`;
  title: string;
  description: string;
  defaultEnabled: boolean;
  defaultRolloutPercentage?: number;
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
  backofficeNavigation?: BackofficeNavItem[];
  runtimeSettings?: RuntimeSettingDefinition[];
  featureFlags?: FeatureFlagDefinition[];
}
