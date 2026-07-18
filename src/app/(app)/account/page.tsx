import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountOverview } from "@/components/account/account-overview";
import { AccountSecurity } from "@/components/account/account-security";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentAccount } from "@/lib/auth/server";

export default async function AccountPage() {
  const account = await getCurrentAccount();

  if (!account) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-[100dvh]">
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="max-w-3xl border-b border-border/80 pb-10">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-primary">Cuenta</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Identidad y sesión</h1>
          <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
            Better Auth gestiona el acceso y sincroniza una representación interna para permisos, auditoría y extensiones.
          </p>
        </header>
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <AccountOverview account={account} />
          <AccountSecurity account={account} />
        </div>
      </main>
    </div>
  );
}
export const metadata: Metadata = {
  title: "Cuenta",
  robots: { index: false, follow: false }
};
