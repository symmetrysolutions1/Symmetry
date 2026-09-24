import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { CheckIcon } from "@/components/icons";
import { companyEmail } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Solicita un diagnóstico de infraestructura verificable con Symmetry.",
};

export default function ContactPage() {
  return (
    <section className="contact-page">
      <div className="shell contact-grid">
        <div className="contact-copy">
          <span className="eyebrow">Diagnóstico inicial</span>
          <h1>Cuéntanos qué debe poder demostrar tu organización.</h1>
          <p>
            Revisaremos el proceso, las fuentes de evidencia, las autoridades involucradas y
            el nivel de resiliencia necesario antes de proponer tecnología.
          </p>
          <div className="contact-expectations">
            {[
              "Identificamos el proceso o territorio crítico",
              "Definimos qué permanece off-chain y qué se ancla",
              "Proponemos perfil Enterprise, Nature o combinado",
              "Entregamos alcance técnico y ruta de implementación",
            ].map((item) => (
              <div key={item}>
                <CheckIcon />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <a className="direct-email" href={`mailto:${companyEmail}`}>
            {companyEmail}
          </a>
        </div>
        <div className="contact-form-wrap">
          <span className="form-index">SYM / 001</span>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
