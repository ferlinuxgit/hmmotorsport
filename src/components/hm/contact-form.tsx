"use client";

import { ArrowSquareOut } from "@phosphor-icons/react";
import { FormEvent, useMemo, useState } from "react";

import { contact, services } from "@/lib/hm-content";

function buildMessage(data: FormData) {
  const serviceSlug = String(data.get("service") ?? "");
  const service = services.find((item) => item.slug === serviceSlug);
  return [
    "Hola, quiero solicitar asesoramiento para mi proyecto.",
    `Nombre: ${String(data.get("name") ?? "")}`,
    `Teléfono: ${String(data.get("phone") ?? "")}`,
    `Coche: ${String(data.get("car") ?? "")}`,
    `Uso: ${String(data.get("use") ?? "")}`,
    `Servicio: ${service?.title ?? "Por definir"}`,
    `Detalles: ${String(data.get("details") ?? "")}`
  ].join("\n");
}

export function ContactForm({ initialService = "" }: { initialService?: string }) {
  const normalizedInitialService = useMemo(
    () => (services.some((service) => service.slug === initialService) ? initialService : ""),
    [initialService]
  );
  const [status, setStatus] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const service = services.find((item) => item.slug === data.get("service"));
    const phone = service?.contactArea === "mechanics" ? contact.mechanics.phone : contact.electronics.phone;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(buildMessage(data))}`;
    setStatus("Mensaje preparado. Se abrirá WhatsApp para que puedas revisarlo y enviarlo.");
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <form onSubmit={onSubmit} className="border border-border bg-card p-5 sm:p-8" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Nombre <span className="sr-only">obligatorio</span>
          <input className="hm-field" name="name" autoComplete="name" required placeholder="Tu nombre" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Teléfono o WhatsApp <span className="sr-only">obligatorio</span>
          <input className="hm-field" name="phone" autoComplete="tel" required inputMode="tel" placeholder="600 000 000" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Coche <span className="sr-only">obligatorio</span>
          <input className="hm-field" name="car" required placeholder="Modelo, año y motor" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Uso
          <select className="hm-field" name="use" defaultValue="">
            <option value="" disabled>Selecciona una opción</option>
            <option>Calle</option>
            <option>Tandas</option>
            <option>Drift</option>
            <option>Competición</option>
            <option>Mixto</option>
          </select>
        </label>
      </div>
      <label className="mt-5 grid gap-2 text-sm font-medium">
        Servicio principal
        <select className="hm-field" name="service" defaultValue={normalizedInitialService}>
          <option value="">Necesito orientación</option>
          {services.map((service) => <option key={service.slug} value={service.slug}>{service.title}</option>)}
        </select>
      </label>
      <label className="mt-5 grid gap-2 text-sm font-medium">
        Objetivo, modificaciones y problema actual <span className="sr-only">obligatorio</span>
        <textarea className="hm-field min-h-36 resize-y py-3" name="details" required placeholder="Cuanta más información incluyas, mejor podremos orientarte." />
      </label>
      <label className="mt-5 flex items-start gap-3 text-xs leading-5 text-muted-foreground">
        <input type="checkbox" required className="mt-1 size-4 accent-primary" />
        <span>Acepto que HM Motorsport utilice estos datos para responder a mi consulta. Consulta la <a href="/privacy" className="text-foreground underline decoration-primary underline-offset-4">política de privacidad</a>.</span>
      </label>
      <button type="submit" className="mt-6 inline-flex h-12 w-full items-center justify-center gap-3 bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card active:scale-[0.99] sm:w-auto">
        Preparar mensaje en WhatsApp <ArrowSquareOut size={19} weight="bold" aria-hidden="true" />
      </button>
      <p className="mt-4 min-h-5 text-xs text-muted-foreground" aria-live="polite">{status}</p>
    </form>
  );
}
