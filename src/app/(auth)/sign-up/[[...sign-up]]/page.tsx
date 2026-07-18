import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { getCurrentAccount } from "@/lib/auth/server";

export default async function SignUpPage() {
  const account = await getCurrentAccount();

  if (account) {
    redirect("/dashboard");
  }

  return (
    <AuthShell title="Crea tu punto de partida." description="Registra una cuenta y entra en una foundation preparada para crecer por módulos.">
      <SignUpForm />
    </AuthShell>
  );
}
export const metadata: Metadata = {
  title: "Crear cuenta",
  robots: { index: false, follow: false }
};
