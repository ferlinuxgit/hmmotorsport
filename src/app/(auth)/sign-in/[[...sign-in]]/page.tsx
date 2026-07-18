import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SignInForm } from "@/components/auth/sign-in-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { getCurrentAccount } from "@/lib/auth/server";

export default async function SignInPage() {
  const account = await getCurrentAccount();

  if (account) {
    redirect("/dashboard");
  }

  return (
    <AuthShell title="Continúa donde lo dejaste." description="Entra para revisar módulos, cuenta y operación desde un workspace autenticado.">
      <SignInForm />
    </AuthShell>
  );
}
export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: false }
};
