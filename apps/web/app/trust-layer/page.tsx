import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";

export const metadata: Metadata = {
  title: "Trust Layer",
  description:
    "La capa blockchain de Symmetry preserva el origen, la integridad y la continuidad de la evidencia.",
};

const principles = [
  {
    index: "01",
    title: "Origen",
    copy: "Cada decisión conserva quién la produjo, cuándo ocurrió y bajo qué autoridad.",
  },
  {
    index: "02",
    title: "Integridad",
    copy: "Si una evidencia cambia, la diferencia puede detectarse. La historia no se reescribe en silencio.",
  },
  {
    index: "03",
    title: "Permanencia",
    copy: "Lo importante no depende de un único servidor, proveedor o punto de falla.",
  },
  {
    index: "04",
    title: "Reconstrucción",
    copy: "Incluso después de un incidente, la organización puede volver a demostrar qué ocurrió.",
  },
];

export default function TrustLayerPage() {
  return (
    <div className="sym-page sym-trust-page">
      <section className="sym-trust-hero">
        <div className="sym-grid-field" aria-hidden="true" />
        <div className="sym-trust-hero-orbit" aria-hidden="true">
          <span className="orbit orbit-one" />
          <span className="orbit orbit-two" />
          <span className="orbit orbit-three" />
          <i />
        </div>
        <div className="sym-shell sym-trust-hero-copy">
          <span className="sym-kicker">
            <i />
            Trust Layer / Blockchain
          </span>
          <h1>
            La confianza que
            <em>no depende de creer.</em>
          </h1>
          <p>
            Una capa silenciosa que preserva la verdad de una operación sin quitarle a la
            empresa el control de su información.
          </p>
          <Link className="sym-button sym-button-primary" href="#technology">
            Conocer nuestra tecnología <ArrowRight />
          </Link>
        </div>
      </section>

      <section className="sym-trust-statement">
        <div className="sym-shell">
          <span className="sym-section-index">01 / EL PORQUÉ</span>
          <p>
            Los sistemas pueden fallar. Las personas pueden equivocarse. Las versiones pueden
            cambiar.
            <strong> La integridad institucional no debería desaparecer con ellas.</strong>
          </p>
        </div>
      </section>

      <section className="sym-principles">
        <div className="sym-shell">
          <div className="sym-section-heading sym-section-heading-compact">
            <span className="sym-kicker">
              <i />
              Lo que preservamos
            </span>
            <h2>Cuatro condiciones para que una historia siga siendo confiable.</h2>
          </div>
          <div className="sym-principle-grid">
            {principles.map((principle) => (
              <article key={principle.index}>
                <span>{principle.index}</span>
                <div className="sym-principle-orb" aria-hidden="true" />
                <h3>{principle.title}</h3>
                <p>{principle.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sym-technology" id="technology">
        <div className="sym-shell sym-technology-layout">
          <div className="sym-technology-copy">
            <span className="sym-kicker sym-kicker-light">
              <i />
              Nuestra tecnología
            </span>
            <h2>Blockchain, sin convertir tu empresa en una blockchain.</h2>
            <p>
              La información sensible continúa bajo control de la organización. Symmetry
              conserva pruebas independientes de su origen e integridad para que una
              afirmación pueda verificarse sin exponerlo todo.
            </p>
          </div>
          <div className="sym-layer-stack">
            <article>
              <span>03</span>
              <div>
                <small>Red de confianza</small>
                <strong>Blockchain</strong>
                <p>Conserva una prueba común que nadie puede cambiar por su cuenta.</p>
              </div>
            </article>
            <article>
              <span>02</span>
              <div>
                <small>Memoria distribuida</small>
                <strong>Evidencia</strong>
                <p>Protege documentos y registros frente a pérdidas o fallas aisladas.</p>
              </div>
            </article>
            <article>
              <span>01</span>
              <div>
                <small>Control soberano</small>
                <strong>Tu empresa</strong>
                <p>Mantiene su identidad, sus permisos y su información sensible.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="sym-root-message">
        <div className="sym-root-orbit" aria-hidden="true" />
        <div className="sym-shell">
          <span>Una empresa. Una identidad. Una raíz propia.</span>
          <h2>Symmetry vive al servicio de la empresa, no al revés.</h2>
          <p>
            Cada organización obtiene una infraestructura independiente que puede crecer con
            los servicios que necesita y conservar su propia historia.
          </p>
          <Link className="sym-button sym-button-primary" href="/contact">
            Diseñar nuestra Trust Layer <ArrowRight />
          </Link>
        </div>
      </section>
    </div>
  );
}
