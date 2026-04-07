import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentAccount, listRecentUsers } from "@/lib/auth/server";
import { isAdminRole } from "@/lib/auth/constants";

export default async function AdminPage() {
  const account = await getCurrentAccount();

  if (!account) {
    redirect("/sign-in");
  }

  if (!isAdminRole(account.role)) {
    redirect("/dashboard");
  }

  const recentUsers = await listRecentUsers(12);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl space-y-8 px-6 py-12">
        <div className="space-y-3">
          <Badge>Admin</Badge>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">Administración</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Vista inicial para supervisar usuarios autenticados y preparar permisos de producto a nivel plataforma.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Usuarios</CardDescription>
              <CardTitle>{recentUsers.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Cargados desde la base interna sincronizada con Clerk.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Rol activo</CardDescription>
              <CardTitle className="capitalize">{account.role}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">El acceso admin se controla con `publicMetadata.role` en Clerk.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>API admin</CardDescription>
              <CardTitle>/api/admin/users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Endpoint base protegido para integrar paneles internos.</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Usuarios recientes</CardTitle>
            <CardDescription>Registros internos creados o actualizados durante autenticación.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentUsers.map((user) => (
              <div key={user.id} className="rounded-2xl border border-border/70 px-4 py-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{user.name ?? user.email}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="capitalize">{user.role}</span>
                    <span>{user.active ? "activo" : "inactivo"}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

