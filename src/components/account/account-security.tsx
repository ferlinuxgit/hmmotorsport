import { SignOutButton } from "@/components/auth/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuthAccount } from "@/lib/auth/server";

export function AccountSecurity({ account }: { account: AuthAccount }) {
  return (
    <Card className="border-border/70 shadow-panel">
      <CardHeader>
        <CardDescription>Seguridad</CardDescription>
        <CardTitle>Sesión activa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={account.emailVerified ? "default" : "secondary"}>
            {account.emailVerified ? "Email verificado" : "Email pendiente"}
          </Badge>
          <Badge variant={account.active ? "secondary" : "outline"}>{account.active ? "Cuenta activa" : "Cuenta inactiva"}</Badge>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 px-4 py-4">
          <div>
            <p className="font-medium">Cerrar sesión</p>
            <p className="text-sm text-muted-foreground">Finaliza la sesión actual y limpia la cookie segura.</p>
          </div>
          <SignOutButton />
        </div>
      </CardContent>
    </Card>
  );
}
