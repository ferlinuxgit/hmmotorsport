import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuthAccount } from "@/lib/auth/server";

export function AccountOverview({ account }: { account: AuthAccount }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription>Perfil</CardDescription>
          <CardTitle>{account.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{account.email}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Rol</CardDescription>
          <CardTitle className="capitalize">{account.role}</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={account.role === "admin" ? "default" : "secondary"}>
            {account.role === "admin" ? "Acceso administrativo" : "Acceso de usuario"}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Cuenta interna</CardDescription>
          <CardTitle>Usuario base</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="break-all text-sm text-muted-foreground">{account.id}</p>
        </CardContent>
      </Card>
    </div>
  );
}
