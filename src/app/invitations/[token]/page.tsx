import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AcceptInvitation } from "@/components/workspaces/accept-invitation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentAccount } from "@/lib/auth/server";
import { getInvitationPreview } from "@/lib/workspaces/invitations";

export const metadata: Metadata = { title: "Invitación", robots: { index: false, follow: false } };

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token;
  const invitation = await getInvitationPreview(token);
  if (!invitation) return <main id="main-content" className="mx-auto max-w-xl px-4 py-20"><Card><CardHeader><CardTitle>Invitación inválida</CardTitle><CardDescription>El enlace no existe o su firma no es válida.</CardDescription></CardHeader></Card></main>;
  const account = await getCurrentAccount();
  if (!account) redirect(`/sign-in?next=${encodeURIComponent(`/invitations/${token}`)}`);
  const expired = invitation.expiresAt <= new Date();
  const emailMismatch = account.email.toLowerCase() !== invitation.email;
  const active = invitation.status === "pending" && !expired;
  return <main id="main-content" className="mx-auto max-w-xl px-4 py-20"><Card><CardHeader><CardTitle>Invitación a {invitation.workspaceName}</CardTitle><CardDescription>Acceso como {invitation.role} para {invitation.email}.</CardDescription></CardHeader><CardContent className="space-y-4">{expired ? <p className="text-sm text-destructive">La invitación ha expirado.</p> : null}{invitation.status !== "pending" ? <p className="text-sm text-muted-foreground">Esta invitación ya está {invitation.status}.</p> : null}{emailMismatch ? <p className="text-sm text-destructive">Has iniciado sesión como {account.email}. Debes usar la cuenta invitada.</p> : null}<AcceptInvitation token={token} disabled={!active || emailMismatch} /></CardContent></Card></main>;
}
