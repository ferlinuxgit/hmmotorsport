import { z } from "zod";

const invitationSchema = z.object({ workspaceName: z.string().min(1).max(255), inviterName: z.string().min(1).max(255), invitationUrl: z.url() });

export function renderEmailTemplate(template: string, payload: Record<string, unknown>) {
  if (template === "workspace.invitation") {
    const value = invitationSchema.parse(payload);
    return {
      subject: `Invitación a ${value.workspaceName}`,
      text: `${value.inviterName} te ha invitado a ${value.workspaceName}. Acepta la invitación: ${value.invitationUrl}`,
      html: `<p><strong>${escapeHtml(value.inviterName)}</strong> te ha invitado a <strong>${escapeHtml(value.workspaceName)}</strong>.</p><p><a href="${escapeHtml(value.invitationUrl)}">Aceptar invitación</a></p>`
    };
  }
  throw new Error(`Unknown email template: ${template}`);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}
