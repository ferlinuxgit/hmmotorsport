import { ArrowRight, CheckCircle, Cube, Gear, UserCircle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AuthAccount } from "@/lib/auth/server";
import { getAppNavigation, getDashboardCards, getInstalledModules } from "@/lib/modules/loader";

export function DashboardShell({ account }: { account: AuthAccount }) {
  const navigation = getAppNavigation();
  const cards = getDashboardCards();
  const modules = getInstalledModules();

  return (
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="grid gap-6 border-b border-border/80 pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-primary">Workspace</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Dashboard extensible</h1>
          <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Navegación, capacidades y acciones se proyectan desde los módulos instalados sin introducir lógica de vertical en el core.</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-card px-4 py-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
            <UserCircle size={22} weight="duotone" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{account.name}</p>
            <p className="truncate text-xs text-muted-foreground">{account.email}</p>
          </div>
          <Badge variant={account.role === "admin" ? "default" : "secondary"}>{account.role}</Badge>
        </div>
      </header>

      <nav aria-label="Áreas del producto" className="flex gap-2 overflow-x-auto border-b border-border/80 py-4">
        {navigation.map((item) => (
          <Link key={`${item.href}-${item.title}`} href={item.href} className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground">
            {item.title}
          </Link>
        ))}
        <Link href="/account" className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground">Cuenta</Link>
        {account.role === "admin" ? <Link href="/admin" className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground">Backoffice</Link> : null}
      </nav>

      <div className="grid gap-12 py-12 lg:grid-cols-[1.2fr_0.8fr]">
        <section aria-labelledby="modules-title">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="modules-title" className="text-2xl font-semibold tracking-[-0.025em]">Capacidades instaladas</h2>
              <p className="mt-2 text-sm text-muted-foreground">Estado real del registro generado durante el build.</p>
            </div>
            <span className="font-mono text-sm text-muted-foreground">{modules.length} activas</span>
          </div>

          <div className="mt-8 border-t border-border/80">
            {modules.length === 0 ? (
              <div className="border-b border-border/80 py-10 text-center">
                <Cube size={30} className="mx-auto text-muted-foreground" aria-hidden="true" />
                <p className="mt-4 font-medium">No hay módulos instalados.</p>
                <p className="mt-2 text-sm text-muted-foreground">Añade una definición en src/extensions y ejecuta modules:sync.</p>
              </div>
            ) : (
              modules.map((module) => (
                <article key={module.key} className="grid gap-4 border-b border-border/80 py-6 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{module.name}</h3>
                      <Badge variant="secondary">{module.area}</Badge>
                    </div>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{module.description}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle size={17} weight="fill" className="text-primary" aria-hidden="true" />
                    {module.dbTables.length} tablas
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <aside className="rounded-2xl bg-secondary p-6 sm:p-8" aria-labelledby="next-title">
          <Gear size={26} weight="duotone" className="text-primary" aria-hidden="true" />
          <h2 id="next-title" className="mt-5 text-2xl font-semibold tracking-[-0.025em]">Convierte la base en producto</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Los módulos actuales demuestran el contrato. El siguiente paso es reemplazar sus rutas de ejemplo por recursos del dominio real.</p>
          <ol className="mt-7 space-y-4 text-sm">
            {["Define el primer recurso de negocio", "Asigna permisos por workspace", "Conecta un flujo completo a su API"].map((item, index) => (
              <li key={item} className="grid grid-cols-[28px_1fr] items-start gap-3">
                <span className="flex size-7 items-center justify-center rounded-md bg-background font-mono text-xs">{index + 1}</span>
                <span className="pt-1">{item}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>

      <section aria-labelledby="actions-title" className="border-t border-border/80 pt-10">
        <div className="max-w-2xl">
          <h2 id="actions-title" className="text-2xl font-semibold tracking-[-0.025em]">Puntos de entrada</h2>
          <p className="mt-2 text-sm text-muted-foreground">Acciones declaradas por las extensiones para continuar el desarrollo.</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {cards.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground md:col-span-2">No hay acciones registradas.</p>
          ) : (
            cards.map((card) => (
              <article key={card.key} className="flex min-h-44 flex-col justify-between rounded-2xl border border-border/80 bg-card p-6">
                <div>
                  <h3 className="text-lg font-semibold">{card.title}</h3>
                  <p className="mt-2 max-w-[48ch] text-sm leading-6 text-muted-foreground">{card.description}</p>
                </div>
                <Button className="mt-6 w-fit" variant="outline" size="sm" asChild>
                  <Link href={card.href}>Abrir flujo <ArrowRight size={16} weight="bold" aria-hidden="true" /></Link>
                </Button>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
