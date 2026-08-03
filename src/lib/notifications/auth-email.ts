import { sendEmail } from "@/lib/notifications/email";

function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character); }

export async function sendAuthActionEmail(input: { kind: "verify" | "reset"; email: string; name?: string | null; url: string }) {
  const action = input.kind === "verify" ? "Verificar email" : "Restablecer contraseña";
  const explanation = input.kind === "verify" ? "Confirma tu dirección para activar la cuenta." : "Usa este enlace para elegir una contraseña nueva. Si no lo solicitaste, ignora este mensaje.";
  await sendEmail({
    to: input.email,
    subject: action,
    text: `${input.name ? `Hola ${input.name}. ` : ""}${explanation} ${input.url}`,
    html: `<p>${input.name ? `Hola ${escapeHtml(input.name)}. ` : ""}${escapeHtml(explanation)}</p><p><a href="${escapeHtml(input.url)}">${action}</a></p>`
  });
}
