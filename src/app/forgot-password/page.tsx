import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/password-recovery-form";

export const metadata: Metadata = { title: "Recuperar contraseña", robots: { index: false, follow: false } };
export default function ForgotPasswordPage() { return <main id="main-content" className="mx-auto max-w-md px-4 py-20"><ForgotPasswordForm /></main>; }
