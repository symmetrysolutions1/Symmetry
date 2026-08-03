import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "@/components/icons";

export const metadata: Metadata = {
  title: "Servicios Symmetry",
  description:
    "Nature Intelligence y Enterprise conectados por EUDR y una misma infraestructura de confianza.",
};

export default function ServicesPage() {
  return (
    <div className="sym-page sym-services-page">
      <section className="sym-subhero">
        <div className="sym-grid-field" aria-hidden="true" />
        <div className="sym-shell sym-subhero-layout">
          <div>
            <span className="sym-kicker">
              <i />
              Servicios Symmetry
            </span>
            <h1>
              Protegemos el valor
              <em>de lo que ocurre.</em>
            </h1>
          </div>
          <p>
            Symmetry trabaja en dos frentes: comprende la realidad del territorio y fortalece
            la realidad de la empresa. EUDR aparece justo en el punto donde ambas deben
            coincidir.
          </p>
        </div>
        <div className="sym-shell sym-subhero-index">
          <span>01</span>
          <div />
          <span>Nature Intelligence + Enterprise</span>
        </div>
      </section>

      <section className="sym-services-map">
        <div className="sym-shell">
          <div className="sym-veins" aria-label="Mapa conceptual de servicios Symmetry">
            <article className="sym-vein sym-vein-nature">
              <span className="sym-vein-index">VETA / 01</span>
              <small>Comprender antes de actuar</small>
              <h2>Nature Intelligence</h2>
              <p>
                Transformamos señales del territorio en decisiones oportunas para empresas,
                organizaciones y proyectos que necesitan proteger naturaleza y reputación.
              </p>
              <ul>
                <li>Observación territorial</li>
                <li>Alertas y lectura de riesgo</li>
                <li>Evidencia ambiental</li>
              </ul>
              <Link href="/solutions/nature-intelligence">
                Descubrir Nature Intelligence <ArrowUpRight />
              </Link>
            </article>

            <Link className="sym-treasure" href="/solutions/eudr">
              <span className="sym-treasure-pulse" />
              <small>INTERSECCIÓN</small>
              <strong>EUDR</strong>
              <p>Origen verificable para mercados que exigen confianza.</p>
              <ArrowRight />
            </Link>

            <article className="sym-vein sym-vein-enterprise">
              <span className="sym-vein-index">VETA / 02</span>
              <small>Operar con claridad</small>
              <h2>Enterprises</h2>
              <p>
                Convertimos decisiones y procesos sensibles en operaciones más claras,
                consistentes y capaces de sostenerse ante una auditoría o una crisis.
              </p>
              <ul>
                <li>VotoID y gobierno corporativo</li>
                <li>Automatización de procesos</li>
                <li>Resolve y operación asistida</li>
              </ul>
              <Link href="/solutions/enterprise">
                Descubrir Enterprises <ArrowUpRight />
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="sym-service-outcomes">
        <div className="sym-shell">
          <div className="sym-section-heading sym-section-heading-compact">
            <span className="sym-kicker">
              <i />
              Una sola promesa
            </span>
            <h2>Que tu operación pueda hablar por sí misma.</h2>
          </div>
          <div className="sym-outcome-grid">
            <article>
              <span>01</span>
              <h3>Ver antes</h3>
              <p>Reconocer cambios y señales antes de que se conviertan en una pérdida.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Actuar mejor</h3>
              <p>Tomar decisiones con información, autoridad y responsabilidades claras.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Demostrar después</h3>
              <p>Conservar una historia confiable cuando llegue una auditoría o una disputa.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="sym-services-proof">
        <div className="sym-shell sym-services-proof-layout">
          <div>
            <span className="sym-kicker sym-kicker-light">
              <i />
              Casos de éxito
            </span>
            <h2>La confianza se demuestra con operaciones reales.</h2>
          </div>
          <div>
            <p>
              Conoce cómo Testigos Digitales convirtió una votación pública en evidencia
              verificable y reconstruible.
            </p>
            <Link className="sym-button sym-button-outline" href="/proof">
              Ver casos de éxito <ArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
