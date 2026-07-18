import { IdentificationCard, UserCircle } from "@phosphor-icons/react/dist/ssr";

import { Badge } from "@/components/ui/badge";
import type { AuthAccount } from "@/lib/auth/server";

export function AccountOverview({ account }: { account: AuthAccount }) {
  return (
    <section className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8" aria-labelledby="profile-title">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
          <UserCircle size={27} weight="duotone" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Perfil</p>
          <h2 id="profile-title" className="mt-1 truncate text-2xl font-semibold">{account.name}</h2>
          <p className="mt-1 truncate text-sm text-muted-foreground">{account.email}</p>
        </div>
      </div>
      <dl className="mt-8 grid gap-6 border-t border-border/80 pt-6 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Rol operativo</dt>
          <dd className="mt-2"><Badge variant={account.role === "admin" ? "default" : "secondary"}>{account.role === "admin" ? "Acceso administrativo" : "Acceso de usuario"}</Badge></dd>
        </div>
        <div>
          <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><IdentificationCard size={16} aria-hidden="true" />Identificador interno</dt>
          <dd className="mt-2 break-all font-mono text-xs">{account.id}</dd>
        </div>
      </dl>
    </section>
  );
}
