import { ArrowRight, CheckCircle, Cube, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getEnabledPaymentProviders, getInstalledModules } from "@/lib/modules/loader";

export function Hero() {
  const modules = getInstalledModules();
  const providers = getEnabledPaymentProviders();

  return (
    <>
      <section className="grid gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
        <div className="space-y-8">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-primary">Next.js, datos, identidad y pagos</p>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-4xl font-semibold leading-[1.04] tracking-[-0.045em] text-balance sm:text-5xl">
              Una base técnica para lanzar sin rehacer el núcleo.
            </h1>
            <p className="max-w-[60ch] text-lg leading-8 text-muted-foreground">
              Marketing, comercio y SaaS comparten una arquitectura modular preparada para evolucionar con el producto.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/dashboard">Explorar dashboard <ArrowRight size={18} weight="bold" aria-hidden="true" /></Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="#modules">Revisar módulos</Link>
            </Button>
          </div>
        </div>

        <div className="grid-surface relative overflow-hidden rounded-3xl border border-border/80 bg-card/80 p-5 shadow-panel sm:p-7">
          <div className="mb-8 flex items-center justify-between gap-4 border-b border-border/70 pb-5">
            <div>
              <p className="text-sm font-semibold">Mapa del sistema</p>
              <p className="mt-1 text-xs text-muted-foreground">Capacidades registradas desde extensiones</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Cube size={20} weight="duotone" aria-hidden="true" />
            </div>
          </div>

          <div className="space-y-3">
            {modules.map((module, index) => (
              <div key={module.key} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-xl border border-border/70 bg-background/75 px-4 py-3.5">
                <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{module.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{module.area}</p>
                </div>
                <CheckCircle size={18} weight="fill" className="text-primary" aria-label="Módulo activo" />
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-xl bg-secondary px-4 py-3 text-sm">
            <ShieldCheck size={20} className="shrink-0 text-primary" aria-hidden="true" />
            <span>El core permanece estable mientras las extensiones crecen.</span>
          </div>
        </div>
      </section>

      <section aria-label="Resumen técnico" className="grid border-y border-border/70 sm:grid-cols-3">
        <div className="py-5 sm:pr-6">
          <p className="text-2xl font-semibold tabular-nums">{modules.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">módulos instalados</p>
        </div>
        <div className="border-t border-border/70 py-5 sm:border-l sm:border-t-0 sm:px-6">
          <p className="text-2xl font-semibold">{providers.join(" + ")}</p>
          <p className="mt-1 text-sm text-muted-foreground">proveedores de pago</p>
        </div>
        <div className="border-t border-border/70 py-5 sm:border-l sm:border-t-0 sm:pl-6">
          <p className="text-2xl font-semibold">23 checks</p>
          <p className="mt-1 text-sm text-muted-foreground">tests y validaciones automatizadas</p>
        </div>
      </section>
    </>
  );
}
