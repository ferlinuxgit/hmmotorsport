import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AuthAccount } from "@/lib/auth/server";
import { getAppNavigation, getDashboardCards, getInstalledModules } from "@/lib/modules/loader";

export function DashboardShell({ account }: { account: AuthAccount }) {
  const navigation = getAppNavigation();
  const cards = getDashboardCards();
  const modules = getInstalledModules();

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-6">
        <div className="space-y-3">
          <Badge variant="secondary">Workspace shell</Badge>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">Dashboard extensible</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            La navegación y las vistas base consumen definiciones de módulo. El core no necesita cambios para sumar nuevas áreas.
          </p>
          <div className="rounded-2xl bg-secondary p-4">
            <p className="text-sm font-medium">{account.name}</p>
            <p className="text-sm text-muted-foreground">{account.email}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.22em] text-primary">{account.role}</p>
          </div>
        </div>
        <Separator />
        <nav className="grid gap-2">
          {navigation.map((item) => (
            <Link
              key={`${item.href}-${item.title}`}
              href={item.href}
              className="rounded-2xl border border-transparent px-4 py-3 text-sm transition hover:border-border hover:bg-background/70"
            >
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-muted-foreground">{item.description}</p>
            </Link>
          ))}
          <Link
            href="/account"
            className="rounded-2xl border border-transparent px-4 py-3 text-sm transition hover:border-border hover:bg-background/70"
          >
            <p className="font-medium">Cuenta</p>
            <p className="mt-1 text-muted-foreground">Perfil, sesiones y ajustes de usuario</p>
          </Link>
          {account.role === "admin" ? (
            <Link
              href="/admin"
              className="rounded-2xl border border-transparent px-4 py-3 text-sm transition hover:border-border hover:bg-background/70"
            >
              <p className="font-medium">Admin</p>
              <p className="mt-1 text-muted-foreground">Usuarios, roles y supervisión del sistema</p>
            </Link>
          ) : null}
        </nav>
      </aside>

      <section className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Cuenta activa</CardTitle>
            <CardDescription>El dashboard ya conoce el usuario autenticado y su rol operativo.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Cuenta</p>
              <p className="mt-2 text-sm font-medium">{account.name}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Email</p>
              <p className="mt-2 text-sm font-medium">{account.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Rol</p>
              <p className="mt-2 text-sm font-medium capitalize">{account.role}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {modules.map((module) => (
            <Card key={module.key}>
              <CardHeader>
                <CardTitle>{module.name}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{module.dbTables.join(", ")}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.key}>
              <CardHeader>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={card.href} className="text-sm font-medium text-primary">
                  Abrir flujo
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
