import type { Metadata } from "next";
import { CreditCard, Cube, CurrencyDollar, Database, Pulse, ShieldCheck, Users } from "@phosphor-icons/react/dist/ssr";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminAccount } from "@/lib/auth/rbac";
import { getAdminOverview, type AdminOverview } from "@/lib/admin/overview";

export const metadata: Metadata = {
  title: "Backoffice",
  robots: {
    index: false,
    follow: false
  }
};

function formatDate(value: Date | null) {
  if (!value) {
    return "Sin actividad";
  }

  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}

function formatMoney(value: string, currency = "USD") {
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency
  }).format(Number(value));
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon
}: {
  title: string;
  value: string | number;
  description: string;
  icon: typeof Pulse;
}) {
  return (
    <article className="border-t border-border/80 py-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="font-mono text-3xl font-semibold tracking-[-0.04em] tabular-nums">{value}</p>
        </div>
        <div className="text-primary">
          <Icon size={24} weight="duotone" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-5 max-w-[36ch] text-sm leading-6 text-muted-foreground">{description}</p>
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === "paid" || status === "active" ? "default" : status === "failed" ? "outline" : "secondary";

  return (
    <Badge variant={variant} className="normal-case tracking-normal">
      {status}
    </Badge>
  );
}

function AnalyticsBars({ overview }: { overview: AdminOverview }) {
  const max = Math.max(...overview.analytics.eventsByDay.map((item) => item.events), 1);

  return (
    <div className="flex h-40 items-end gap-2">
      {overview.analytics.eventsByDay.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
          Sin eventos todavía
        </div>
      ) : (
        overview.analytics.eventsByDay.map((item) => (
          <div key={item.day} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t bg-primary"
              style={{ height: `${Math.max((item.events / max) * 100, 8)}%` }}
              title={`${item.day}: ${item.events}`}
            />
            <span className="w-full truncate text-center text-[11px] text-muted-foreground">{item.day.slice(5)}</span>
          </div>
        ))
      )}
    </div>
  );
}

export default async function AdminPage() {
  const account = await requireAdminAccount();
  const overview = await getAdminOverview();
  const revenueLabel =
    overview.orders.revenueByCurrency.length === 0
      ? formatMoney("0", "USD")
      : overview.orders.revenueByCurrency.map((item) => formatMoney(item.revenue, item.currency)).join(" / ");

  return (
    <main id="main-content" className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-primary">Backoffice</p>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Panel de control</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Operación interna para usuarios, billing, módulos, salud de producción y analítica de primera parte.
            </p>
          </div>
          <div className="border-l-2 border-primary pl-4 text-sm text-muted-foreground">
            Sesión admin: <span className="font-medium text-foreground">{account.email}</span>
          </div>
        </div>

        <div className="grid gap-x-8 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Usuarios"
            value={overview.users.total}
            description={`${overview.users.active} activos, ${overview.users.admins} admins, ${overview.users.verified} verificados`}
            icon={Users}
          />
          <MetricCard
            title="Revenue pagado"
            value={revenueLabel}
            description={`${overview.orders.paid} órdenes pagadas de ${overview.orders.total} totales`}
            icon={CurrencyDollar}
          />
          <MetricCard
            title="Sesiones"
            value={overview.sessions.active}
            description={`${overview.sessions.total} sesiones históricas registradas por Better Auth`}
            icon={ShieldCheck}
          />
          <MetricCard
            title="Analytics"
            value={overview.analytics.events}
            description={`${overview.analytics.sessions} sesiones y ${overview.analytics.users} usuarios identificados en 14 días`}
            icon={Pulse}
          />
        </div>

        <div id="analytics" className="scroll-mt-36 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Actividad web</CardTitle>
              <CardDescription>Eventos capturados por el tracker interno durante los últimos 14 días.</CardDescription>
            </CardHeader>
            <CardContent>
              <AnalyticsBars overview={overview} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Readiness</CardTitle>
              <CardDescription>Estado de configuración crítica para producción.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview.configurationIssues.length === 0 ? (
                <div className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm">Configuración crítica sin incidencias.</div>
              ) : (
                overview.configurationIssues.map((issue) => (
                  <div key={issue} className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
                    {issue}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Usuarios recientes</CardTitle>
              <CardDescription>Cuentas sincronizadas desde Better Auth hacia la tabla interna `users`.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <caption className="sr-only">Usuarios creados recientemente y su estado de acceso</caption>
                <thead className="border-b text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4 font-medium">Usuario</th>
                    <th className="py-3 pr-4 font-medium">Rol</th>
                    <th className="py-3 pr-4 font-medium">Email</th>
                    <th className="py-3 pr-4 font-medium">Último acceso</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.recentUsers.length === 0 ? (
                    <tr><td colSpan={4} className="py-10 text-center text-muted-foreground">Sin usuarios todavía</td></tr>
                  ) : overview.recentUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border/70 last:border-b-0">
                      <td className="py-4 pr-4">
                        <div className="font-medium">{user.name ?? user.email}</div>
                        <div className="text-xs text-muted-foreground">Alta {formatDate(user.createdAt)}</div>
                      </td>
                      <td className="py-4 pr-4">
                        <StatusBadge status={user.role} />
                      </td>
                      <td className="py-4 pr-4">
                        <div>{user.email}</div>
                        <div className="text-xs text-muted-foreground">{user.emailVerified ? "Verificado" : "Pendiente"}</div>
                      </td>
                      <td className="py-4 pr-4 text-muted-foreground">{formatDate(user.lastSignInAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Módulos</CardTitle>
              <CardDescription>Capacidades instaladas y superficies que declara cada extensión.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview.modules.map((module) => (
                <div key={module.key} className="border-b border-border/80 py-4 last:border-b-0">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{module.name}</p>
                      <p className="text-xs text-muted-foreground">{module.area}</p>
                    </div>
                    <Cube size={17} weight="duotone" className="text-muted-foreground" aria-hidden="true" />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{module.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div id="commerce" className="scroll-mt-36 grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Órdenes recientes</CardTitle>
              <CardDescription>Checkout interno, proveedor, estado y cliente asociado.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <caption className="sr-only">Órdenes recientes con proveedor, estado y total</caption>
                <thead className="border-b text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4 font-medium">Orden</th>
                    <th className="py-3 pr-4 font-medium">Cliente</th>
                    <th className="py-3 pr-4 font-medium">Proveedor</th>
                    <th className="py-3 pr-4 font-medium">Estado</th>
                    <th className="py-3 pr-4 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        Sin órdenes todavía
                      </td>
                    </tr>
                  ) : (
                    overview.recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-border/70">
                        <td className="py-4 pr-4">
                          <div className="font-mono text-xs">{order.id.slice(0, 8)}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</div>
                        </td>
                        <td className="py-4 pr-4">{order.userEmail ?? "Sin usuario"}</td>
                        <td className="py-4 pr-4 capitalize">{order.provider}</td>
                        <td className="py-4 pr-4">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="py-4 pr-4">{formatMoney(String(order.total), order.currency)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing</CardTitle>
              <CardDescription>Productos, precios y providers habilitados por módulos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 divide-x divide-border border-y border-border py-4 text-center">
                <div className="px-2">
                  <p className="font-mono text-2xl font-semibold tabular-nums">{overview.products.total}</p>
                  <p className="text-xs text-muted-foreground">Productos</p>
                </div>
                <div className="px-2">
                  <p className="font-mono text-2xl font-semibold tabular-nums">{overview.products.prices}</p>
                  <p className="text-xs text-muted-foreground">Precios</p>
                </div>
                <div className="px-2">
                  <p className="font-mono text-2xl font-semibold tabular-nums">{overview.orders.pending}</p>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                </div>
              </div>
              <div className="space-y-2">
                {overview.enabledPaymentProviders.map((provider) => (
                  <div key={provider} className="flex items-center justify-between border-b border-border/80 py-3 last:border-b-0">
                    <span className="capitalize">{provider}</span>
                    <CreditCard size={17} weight="duotone" className="text-muted-foreground" aria-hidden="true" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Páginas principales</CardTitle>
              <CardDescription>Ranking de page views capturadas por analytics interno.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview.analytics.pageViews.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin page views todavía.</p>
              ) : (
                overview.analytics.pageViews.map((page) => (
                  <div key={page.path} className="flex items-center justify-between gap-4 border-b border-border/80 py-3 last:border-b-0">
                    <span className="truncate font-mono text-xs">{page.path}</span>
                    <span className="text-sm font-medium">{page.views}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eventos recientes</CardTitle>
              <CardDescription>Últimas señales de analítica recibidas por el backend.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview.recentAnalyticsEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin eventos todavía.</p>
              ) : (
                overview.recentAnalyticsEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between gap-4 border-b border-border/80 py-3 last:border-b-0">
                    <div className="min-w-0">
                      <p className="font-medium">{event.eventName}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">{event.path}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(event.createdAt)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card id="tenants" className="scroll-mt-36">
          <CardHeader>
            <CardTitle>Datos operativos</CardTitle>
            <CardDescription>Estado resumido de los modelos transversales del boilerplate.</CardDescription>
          </CardHeader>
          <CardContent className="grid border-t border-border/80 md:grid-cols-4 md:divide-x md:divide-border">
            <div className="border-b border-border/80 py-5 md:border-b-0 md:px-5 md:first:pl-0">
              <Database size={21} weight="duotone" className="mb-3 text-muted-foreground" aria-hidden="true" />
              <p className="font-mono text-2xl font-semibold tabular-nums">{overview.workspaces.total}</p>
              <p className="text-sm text-muted-foreground">Workspaces</p>
            </div>
            <div className="border-b border-border/80 py-5 md:border-b-0 md:px-5">
              <Users size={21} weight="duotone" className="mb-3 text-muted-foreground" aria-hidden="true" />
              <p className="font-mono text-2xl font-semibold tabular-nums">{overview.workspaces.memberships}</p>
              <p className="text-sm text-muted-foreground">Miembros</p>
            </div>
            <div className="border-b border-border/80 py-5 md:border-b-0 md:px-5">
              <Pulse size={21} weight="duotone" className="mb-3 text-muted-foreground" aria-hidden="true" />
              <p className="font-mono text-2xl font-semibold tabular-nums">{overview.orders.failed}</p>
              <p className="text-sm text-muted-foreground">Órdenes fallidas/canceladas</p>
            </div>
            <div className="py-5 md:px-5 md:last:pr-0">
              <Cube size={21} weight="duotone" className="mb-3 text-muted-foreground" aria-hidden="true" />
              <p className="font-mono text-2xl font-semibold tabular-nums">{overview.modules.length}</p>
              <p className="text-sm text-muted-foreground">Módulos activos</p>
            </div>
          </CardContent>
        </Card>
    </main>
  );
}
