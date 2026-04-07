import { getInstalledModules } from "@/lib/modules/loader";

export function SiteFooter() {
  const modules = getInstalledModules();

  return (
    <footer className="border-t border-border/70 bg-background/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Universal foundation</p>
          <p className="max-w-xl text-sm text-muted-foreground">
            Boilerplate orientado a web estática, e-commerce y SaaS con backend, pagos y base de datos listos para extender.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {modules.length} módulos activos cargados desde <code>src/extensions</code>
        </div>
      </div>
    </footer>
  );
}

