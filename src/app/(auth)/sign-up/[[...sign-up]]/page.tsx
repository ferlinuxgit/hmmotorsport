import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentAccount } from "@/lib/auth/server";

export default async function SignUpPage() {
  const account = await getCurrentAccount();

  if (account) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex max-w-lg px-6 py-16">
        <div className="w-full">
          <SignUpForm />
        </div>
      </main>
    </div>
  );
}
export const metadata: Metadata = {
  title: "Crear cuenta",
  robots: { index: false, follow: false }
};
