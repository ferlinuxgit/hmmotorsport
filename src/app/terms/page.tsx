import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@/components/layout/legal-page";

export const metadata: Metadata = {
  title: "Aviso legal",
  description: "Condiciones generales de uso del sitio web de HM Motorsport.",
  alternates: { canonical: "/terms" }
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Aviso legal"
      intro="Este sitio presenta los servicios y canales de contacto de HM Motorsport. La información publicada tiene carácter general y no sustituye una valoración técnica del vehículo."
    >
      <LegalSection title="Contenido técnico">
        <p>Las recomendaciones, plazos y resultados dependen del estado del coche, el hardware instalado, el combustible y el uso previsto. Cada trabajo se concreta después de revisar el proyecto.</p>
      </LegalSection>
      <LegalSection title="Presupuestos">
        <p>Una conversación o formulario inicial no constituye un presupuesto vinculante. El alcance y el importe se confirman cuando existe información suficiente para valorar el trabajo.</p>
      </LegalSection>
      <LegalSection title="Propiedad del contenido">
        <p>Los textos, fotografías, logotipo y elementos de identidad de este sitio pertenecen a sus respectivos titulares y no pueden reutilizarse sin autorización.</p>
      </LegalSection>
      <LegalSection title="Cambios y contacto">
        <p>Para consultas relacionadas con el sitio o sus contenidos, escribe a contacto@hmmotorsport.es.</p>
      </LegalSection>
    </LegalPage>
  );
}
