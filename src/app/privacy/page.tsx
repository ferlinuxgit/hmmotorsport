import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@/components/layout/legal-page";

export const metadata: Metadata = {
  title: "Privacidad",
  description: "Información de privacidad de la instalación de referencia.",
  alternates: { canonical: "/privacy" }
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacidad"
      intro="Esta página documenta el comportamiento de datos incluido en la instalación de referencia. Cada producto debe completarla con su responsable, finalidad y jurisdicción antes de publicarse."
    >
      <LegalSection title="Datos de cuenta">
        <p>Cuando una persona crea una cuenta, el sistema almacena nombre, email, estado de verificación, rol y datos técnicos de sesión necesarios para autenticarla.</p>
      </LegalSection>
      <LegalSection title="Analítica propia">
        <p>La base puede registrar rutas visitadas, eventos, identificadores locales de sesión, navegador y usuario autenticado. No almacena direcciones IP dentro de la tabla de analítica por defecto.</p>
      </LegalSection>
      <LegalSection title="Pagos">
        <p>Las órdenes conservan proveedor, importe, moneda, estado e identificadores externos. Los datos sensibles de pago se procesan en Stripe o PayPal y no se guardan directamente en esta aplicación.</p>
      </LegalSection>
      <LegalSection title="Conservación y derechos">
        <p>La política final debe definir periodos de conservación, mecanismo de acceso, rectificación, eliminación, portabilidad y el canal de contacto del responsable del tratamiento.</p>
      </LegalSection>
    </LegalPage>
  );
}
