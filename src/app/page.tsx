import {
  ArrowRight,
  BracketsCurly,
  ChartLineUp,
  CheckCircle,
  Database,
  Fingerprint,
  Package,
  Pulse,
  ShieldCheck
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";

import { Hero } from "@/components/marketing/hero";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { getInstalledModules, getMarketingSections } from "@/lib/modules/loader";
import { cn } from "@/lib/utils";

const foundations = [
  {
    title: "Frontend componible",
    description: "App Router, Server Components y una capa visual pequeña que se puede sustituir sin tocar dominio.",
    icon: BracketsCurly
  },
  {
    title: "Datos reproducibles",
    description: "PostgreSQL y Drizzle con migraciones versionadas, seeds y soporte para infraestructura interna o gestionada.",
    icon: Database
  },
  {
    title: "Identidad operativa",
    description: "Better Auth, sesiones, cuentas activas, roles administrativos y una ruta clara hacia permisos por workspace.",
    icon: Fingerprint
  },
  {
    title: "Pagos desacoplados",
    description: "Órdenes internas, Stripe, PayPal y webhooks idempotentes sin confiar en importes enviados por el cliente.",
    icon: ShieldCheck
  }
];

const operationalSignals = [
  ["/api/live", "Proceso disponible"],
  ["/api/ready", "Configuración y dependencias"],
  ["/api/health", "Estado agregado del sistema"]
] as const;

export default function HomePage() {
  const modules = getInstalledModules();
  const sections = getMarketingSections();

  return (
    <div className="min-h-[100dvh] overflow-x-hidden">
      <SiteHeader />
      <main id="main-content">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Hero />

          <section id="stack" className="py-24 lg:py-32">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Un núcleo pequeño para problemas transversales.</h2>
              <p className="mt-5 max-w-[65ch] text-base leading-7 text-muted-foreground">
                La base resuelve infraestructura compartida. El dominio específico permanece en extensiones que se pueden añadir, retirar y probar de forma aislada.
              </p>
            </div>

            <div className="mt-12 grid border-t border-border/80 md:grid-cols-2">
              {foundations.map(({ title, description, icon: Icon }, index) => (
                <article
                  key={title}
                  className={cn(
                    "grid grid-cols-[auto_1fr] gap-5 border-b border-border/80 py-7 md:px-7",
                    index % 2 === 0 ? "md:border-r md:pl-0" : "md:pr-0"
                  )}
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
                    <Icon size={21} weight="duotone" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-2 max-w-[52ch] text-sm leading-6 text-muted-foreground">{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="modules" className="py-20 lg:py-28">
            <div className="max-w-3xl">
              <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-primary">Extensiones instaladas</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Tres verticales, un mismo contrato.</h2>
              <p className="mt-5 max-w-[65ch] leading-7 text-muted-foreground">
                Navegación, contenido de marketing, superficies privadas, tablas y providers se registran desde cada módulo.
              </p>
            </div>

            <div className="mt-12 grid gap-4 lg:grid-cols-12">
              {modules.map((module, index) => (
                <article
                  key={module.key}
                  className={cn(
                    "rounded-2xl border border-border/80 p-6 sm:p-8",
                    index === 0 && "bg-primary text-primary-foreground lg:col-span-7",
                    index === 1 && "bg-card lg:col-span-5",
                    index === 2 && "grid gap-8 bg-secondary lg:col-span-12 lg:grid-cols-[1fr_auto] lg:items-end"
                  )}
                >
                  <div>
                    <div className="mb-10 flex items-center justify-between gap-4">
                      <span className="font-mono text-xs uppercase tracking-[0.12em] opacity-70">{module.area}</span>
                      <Package size={22} weight="duotone" aria-hidden="true" />
                    </div>
                    <h3 className="text-2xl font-semibold tracking-[-0.025em]">{module.name}</h3>
                    <p className={cn("mt-3 max-w-xl text-sm leading-6", index === 0 ? "text-primary-foreground/75" : "text-muted-foreground")}>{module.description}</p>
                  </div>
                  <div className="mt-8 flex flex-wrap gap-2 lg:mt-0">
                    {module.dbTables.map((table) => (
                      <code key={table} className={cn("rounded-md px-2.5 py-1.5 text-xs", index === 0 ? "bg-primary-foreground/10" : "bg-background/80")}>{table}</code>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="py-20 lg:py-28">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div className="lg:sticky lg:top-28">
                <Pulse size={30} weight="duotone" className="text-primary" aria-hidden="true" />
                <h2 className="mt-6 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Operación visible desde el primer despliegue.</h2>
                <p className="mt-5 max-w-[55ch] leading-7 text-muted-foreground">
                  La app expone señales útiles para contenedores, balanceadores y operación interna sin mezclar ese código con las páginas de producto.
                </p>
              </div>

              <div className="border-t border-border/80">
                {operationalSignals.map(([path, label]) => (
                  <div key={path} className="grid gap-3 border-b border-border/80 py-6 sm:grid-cols-[180px_1fr_auto] sm:items-center">
                    <code className="text-sm text-primary">{path}</code>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <CheckCircle size={18} weight="fill" className="text-primary" aria-label="Disponible" />
                  </div>
                ))}
                <div className="mt-8 grid gap-4 rounded-2xl bg-card p-6 sm:grid-cols-2">
                  <div>
                    <ChartLineUp size={22} className="text-primary" aria-hidden="true" />
                    <h3 className="mt-4 font-semibold">Analítica propia</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">Page views y eventos operativos sin almacenar IP por defecto.</p>
                  </div>
                  <div>
                    <ShieldCheck size={22} className="text-primary" aria-hidden="true" />
                    <h3 className="mt-4 font-semibold">Límites distribuidos</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">Protección para auth, checkout, analítica y administración.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-20 lg:py-28">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">El contenido también se registra por módulo.</h2>
              <p className="mt-5 max-w-[65ch] leading-7 text-muted-foreground">
                Estas capacidades llegan al sitio público sin añadir condicionales por vertical dentro del core.
              </p>
            </div>
            <div className="mt-12 border-t border-border/80">
              {sections.map((section, index) => (
                <article key={section.key} className="grid gap-4 border-b border-border/80 py-7 md:grid-cols-[80px_1fr_1fr] md:gap-8">
                  <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
                  <h3 className="text-lg font-semibold">{section.title}</h3>
                  <p className="max-w-[55ch] text-sm leading-6 text-muted-foreground">{section.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="grid-surface my-20 rounded-3xl border border-border/80 bg-card/80 px-6 py-14 text-center sm:px-10 sm:py-20">
            <h2 className="mx-auto max-w-3xl text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">Empieza con una base que ya explica cómo crecer.</h2>
            <p className="mx-auto mt-5 max-w-xl leading-7 text-muted-foreground">Crea una cuenta, revisa las superficies privadas y sustituye los módulos de ejemplo por tu dominio real.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild><Link href="/sign-up">Crear cuenta <ArrowRight size={18} weight="bold" aria-hidden="true" /></Link></Button>
              <Button size="lg" variant="outline" asChild><Link href="/dashboard">Ver dashboard</Link></Button>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export const metadata: Metadata = {
  alternates: { canonical: "/" }
};
