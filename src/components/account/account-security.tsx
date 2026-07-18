import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Badge } from "@/components/ui/badge";
import type { AuthAccount } from "@/lib/auth/server";

export function AccountSecurity({ account }: { account: AuthAccount }) {
  return (
    <section className="rounded-2xl bg-secondary p-6 sm:p-8" aria-labelledby="security-title">
      <ShieldCheck size={28} weight="duotone" className="text-primary" aria-hidden="true" />
      <h2 id="security-title" className="mt-5 text-2xl font-semibold">Seguridad de la cuenta</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Estado de identidad y control de la sesión actual.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Badge variant={account.emailVerified ? "default" : "secondary"}>{account.emailVerified ? "Email verificado" : "Email pendiente"}</Badge>
        <Badge variant={account.active ? "secondary" : "outline"}>{account.active ? "Cuenta activa" : "Cuenta inactiva"}</Badge>
      </div>
      <div className="mt-8 border-t border-border/80 pt-6">
        <p className="font-medium">Cerrar sesión</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Finaliza la sesión actual y elimina su cookie segura del navegador.</p>
        <SignOutButton className="mt-5" />
      </div>
    </section>
  );
}
