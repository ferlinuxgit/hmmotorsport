import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@/components/layout/legal-page";

export const metadata: Metadata = {
  title: "Términos",
  description: "Términos de uso de la instalación de referencia.",
  alternates: { canonical: "/terms" }
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Términos de uso"
      intro="Estos términos describen únicamente el comportamiento base del software. Deben sustituirse por condiciones revisadas para el producto, entidad y mercado donde se publique."
    >
      <LegalSection title="Uso de la cuenta">
        <p>La persona usuaria debe mantener sus credenciales protegidas y utilizar la aplicación de forma lícita. Las cuentas desactivadas no pueden crear nuevas sesiones.</p>
      </LegalSection>
      <LegalSection title="Disponibilidad">
        <p>La base incorpora señales de salud y readiness, pero no promete un nivel de servicio concreto. El producto final debe declarar soporte, disponibilidad y mantenimiento aplicables.</p>
      </LegalSection>
      <LegalSection title="Pagos y reembolsos">
        <p>Los precios se resuelven en el servidor y los cobros se procesan mediante proveedores externos. El producto final debe documentar impuestos, renovaciones, cancelaciones y reembolsos.</p>
      </LegalSection>
      <LegalSection title="Cambios y contacto">
        <p>La entidad operadora debe publicar una fecha de vigencia, un historial de cambios materiales y un canal verificable para consultas legales.</p>
      </LegalSection>
    </LegalPage>
  );
}
