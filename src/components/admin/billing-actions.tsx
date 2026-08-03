"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

async function expectOk(response: Response) { const body = (await response.json()) as { error?: string }; if (!response.ok) throw new Error(body.error ?? "No se pudo completar la operación"); }

export function BillingActions({ orderId, total, refundable }: { orderId: string; total: string; refundable: boolean }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  async function reconcile() { setBusy(true); setError(null); try { const response = await fetch(`/api/admin/billing/orders/${orderId}/reconcile`, { method: "POST" }); await expectOk(response); router.refresh(); } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo reconciliar"); } finally { setBusy(false); } }
  async function refund(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!window.confirm("¿Solicitar este reembolso? Se procesará de forma asíncrona en el provider.")) return; setBusy(true); setError(null); const data = new FormData(event.currentTarget); try { const response = await fetch(`/api/admin/billing/orders/${orderId}/refunds`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ amount: data.get("amount"), reason: data.get("reason") }) }); await expectOk(response); router.refresh(); } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo solicitar el reembolso"); } finally { setBusy(false); } }
  return <div className="space-y-3"><Button type="button" size="sm" variant="outline" disabled={busy} onClick={reconcile}>Reconciliar provider</Button>{refundable ? <form onSubmit={refund} className="flex flex-wrap items-end gap-2"><Input name="amount" required defaultValue={total} className="w-28" aria-label="Importe a reembolsar" /><Input name="reason" required minLength={3} maxLength={255} placeholder="Motivo" className="min-w-48 flex-1" /><Button type="submit" size="sm" disabled={busy}>Reembolsar</Button></form> : null}{error ? <p className="text-xs text-destructive">{error}</p> : null}</div>;
}
