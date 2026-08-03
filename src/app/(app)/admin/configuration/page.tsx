import type { Metadata } from "next";

import { ConfigurationEditor } from "@/components/admin/configuration-editor";
import { listRuntimeConfiguration } from "@/lib/config/runtime";

export const metadata: Metadata = { title: "Configuración | Backoffice", robots: { index: false, follow: false } };

export default async function AdminConfigurationPage() {
  const configuration = await listRuntimeConfiguration();
  return <main id="main-content" className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 sm:py-14"><div className="space-y-3"><p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">Control operativo</p><h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Configuración</h1><p className="max-w-3xl text-sm text-muted-foreground">Cambia comportamiento sin desplegar código, con valores tipados, versiones, rollout estable y auditoría.</p></div><ConfigurationEditor settings={configuration.settings} flags={configuration.flags} /></main>;
}
