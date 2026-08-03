import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/password-recovery-form";

export const metadata: Metadata = { title: "Nueva contraseña", robots: { index: false, follow: false } };
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) { return <main id="main-content" className="mx-auto max-w-md px-4 py-20"><ResetPasswordForm token={(await searchParams).token ?? null} /></main>; }
