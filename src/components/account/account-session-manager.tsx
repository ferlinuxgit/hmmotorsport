"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/auth-client";

export function AccountSessionManager() {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  async function revokeOthers() { setBusy(true); setError(null); setMessage(null); try { const result = await authClient.revokeOtherSessions(); if (result.error) throw new Error(result.error.message); setMessage("Las demás sesiones se han cerrado."); } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudieron cerrar las sesiones"); } finally { setBusy(false); } }
  async function changePassword(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(null); setMessage(null); const form = event.currentTarget; const data = new FormData(form); const currentPassword = String(data.get("currentPassword")); const newPassword = String(data.get("newPassword")); const confirmation = String(data.get("confirmation")); if (newPassword !== confirmation) { setError("Las contraseñas nuevas no coinciden."); setBusy(false); return; } try { const result = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true }); if (result.error) throw new Error(result.error.message); form.reset(); setMessage("Contraseña actualizada y otras sesiones cerradas."); } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo cambiar la contraseña"); } finally { setBusy(false); } }
  return <div className="mt-8 space-y-6 border-t border-border/80 pt-6"><div><p className="font-medium">Sesiones</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Conserva esta sesión y revoca el resto de dispositivos.</p><Button className="mt-3" type="button" variant="outline" disabled={busy} onClick={revokeOthers}>Cerrar otras sesiones</Button></div><form onSubmit={changePassword} className="space-y-3"><p className="font-medium">Cambiar contraseña</p><Input name="currentPassword" type="password" autoComplete="current-password" required placeholder="Contraseña actual" /><Input name="newPassword" type="password" autoComplete="new-password" required minLength={12} placeholder="Nueva contraseña" /><Input name="confirmation" type="password" autoComplete="new-password" required minLength={12} placeholder="Repetir nueva contraseña" /><Button type="submit" disabled={busy}>Actualizar contraseña</Button></form>{message ? <p className="text-sm text-muted-foreground" role="status">{message}</p> : null}{error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}</div>;
}
