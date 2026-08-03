import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@/components/layout/legal-page";

export const metadata: Metadata = {
  title: "Privacidad",
  description: "Información básica sobre privacidad y tratamiento de consultas en HM Motorsport.",
  alternates: { canonical: "/privacy" }
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacidad"
      intro="HM Motorsport utiliza los datos que facilitas únicamente para atender tu consulta, preparar una valoración inicial y mantener la comunicación relacionada con tu proyecto."
    >
      <LegalSection title="Datos de contacto">
        <p>Podemos tratar tu nombre, teléfono, email y la información técnica del vehículo que incluyas en una consulta.</p>
      </LegalSection>
      <LegalSection title="Finalidad">
        <p>Usamos esos datos para responder, solicitar información adicional y valorar el alcance del trabajo. No utilizamos la consulta para crear perfiles comerciales automatizados.</p>
      </LegalSection>
      <LegalSection title="Canal de contacto">
        <p>Puedes plantear cualquier solicitud relacionada con tus datos escribiendo a contacto@hmmotorsport.es.</p>
      </LegalSection>
      <LegalSection title="Conservación y derechos">
        <p>Conservamos la información durante el tiempo necesario para atender el proyecto y las obligaciones aplicables. Puedes solicitar acceso, rectificación o eliminación mediante el canal indicado.</p>
      </LegalSection>
    </LegalPage>
  );
}
