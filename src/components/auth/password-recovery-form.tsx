"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/auth-client";

export function ForgotPasswordForm() {
  const [busy, setBusy] = useState(false); const [done, setDone] = useState(false); const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(null); const data = new FormData(event.currentTarget); try { const result = await authClient.requestPasswordReset({ email: String(data.get("email")), redirectTo: "/reset-password" }); if (result.error) throw new Error(result.error.message); setDone(true); } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo solicitar el enlace"); } finally { setBusy(false); } }
  return <Card><CardHeader><CardTitle>Recuperar contraseña</CardTitle><CardDescription>El resultado no revela si una cuenta existe.</CardDescription></CardHeader><CardContent>{done ? <p className="rounded-xl bg-secondary p-4 text-sm">Si el email existe, recibirás un enlace que caduca en una hora.</p> : <form onSubmit={submit} className="space-y-4"><label className="block text-sm font-medium">Email<Input name="email" type="email" autoComplete="email" required className="mt-2" /></label><Button type="submit" disabled={busy}>{busy ? "Enviando…" : "Enviar enlace"}</Button>{error ? <p className="text-sm text-destructive">{error}</p> : null}</form>}</CardContent></Card>;
}

export function ResetPasswordForm({ token }: { token: string | null }) {
  const [busy, setBusy] = useState(false); const [done, setDone] = useState(false); const [error, setError] = useState<string | null>(token ? null : "El enlace no contiene un token válido.");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!token) return; setBusy(true); setError(null); const data = new FormData(event.currentTarget); const password = String(data.get("password")); const confirmation = String(data.get("confirmation")); if (password !== confirmation) { setError("Las contraseñas no coinciden."); setBusy(false); return; } try { const result = await authClient.resetPassword({ newPassword: password, token }); if (result.error) throw new Error(result.error.message); setDone(true); } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo restablecer la contraseña"); } finally { setBusy(false); } }
  return <Card><CardHeader><CardTitle>Nueva contraseña</CardTitle><CardDescription>El token es de un solo uso y caduca en una hora.</CardDescription></CardHeader><CardContent>{done ? <p className="rounded-xl bg-secondary p-4 text-sm">Contraseña actualizada. Ya puedes iniciar sesión.</p> : <form onSubmit={submit} className="space-y-4"><label className="block text-sm font-medium">Contraseña<Input name="password" type="password" autoComplete="new-password" required minLength={12} className="mt-2" /></label><label className="block text-sm font-medium">Confirmar contraseña<Input name="confirmation" type="password" autoComplete="new-password" required minLength={12} className="mt-2" /></label><Button type="submit" disabled={busy || !token}>{busy ? "Guardando…" : "Guardar contraseña"}</Button>{error ? <p className="text-sm text-destructive">{error}</p> : null}</form>}</CardContent></Card>;
}
