import type { Metadata } from "next";
import { companyEmail } from "@/lib/content";

export const metadata: Metadata = {
  title: "Privacidad",
  description: "Política de tratamiento de datos del formulario comercial de Symmetry.",
};

export default function PrivacyPage() {
  return (
    <section className="legal-page">
      <div className="shell legal-shell">
        <span className="eyebrow">Privacidad</span>
        <h1>Tratamiento de solicitudes comerciales</h1>
        <p className="legal-updated">Última actualización: 27 de julio de 2026</p>
        <div className="legal-content">
          <h2>Datos que recibimos</h2>
          <p>
            El formulario solicita nombre, organización, correo corporativo, área de interés y
            una descripción de la necesidad. No solicitamos claves privadas, documentos de
            identidad ni credenciales de sistemas empresariales.
          </p>
          <h2>Finalidad</h2>
          <p>
            Usamos estos datos para responder la solicitud, evaluar un posible servicio y
            preparar una conversación de diagnóstico. No vendemos la información recibida.
          </p>
          <h2>Conservación y proveedores</h2>
          <p>
            Los mensajes pueden ser procesados por el proveedor de correo o webhook
            configurado por Symmetry y se conservan únicamente durante el tiempo necesario
            para gestionar la relación comercial y cumplir obligaciones aplicables.
          </p>
          <h2>Solicitudes</h2>
          <p>
            Para solicitar acceso, corrección o eliminación de información enviada, escribe a{" "}
            <a href={`mailto:${companyEmail}`}>{companyEmail}</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
