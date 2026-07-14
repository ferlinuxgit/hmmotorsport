import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountOverview } from "@/components/account/account-overview";
import { AccountSecurity } from "@/components/account/account-security";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { getCurrentAccount } from "@/lib/auth/server";

export default async function AccountPage() {
  const account = await getCurrentAccount();

  if (!account) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl space-y-8 px-6 py-12">
        <div className="space-y-3">
          <Badge variant="secondary">Account</Badge>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">Cuenta de usuario</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Cuenta autenticada con Better Auth y sincronizada con la base interna para permisos, auditoría y extensiones futuras.
          </p>
        </div>

        <AccountOverview account={account} />
        <AccountSecurity account={account} />
      </main>
    </div>
  );
}
export const metadata: Metadata = {
  title: "Cuenta",
  robots: { index: false, follow: false }
};
