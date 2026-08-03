import type { Metadata } from "next";
import Link from "next/link";
import { SolutionHero } from "@/components/solution-hero";
import { ArrowRight, CheckIcon, GlobeIcon, WorkflowIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "EUDR",
  description:
    "Trazabilidad y evidencia de debida diligencia EUDR para empresas y territorios.",
};

export default function EudrPage() {
  return (
    <>
      <SolutionHero
        eyebrow="Servicio transversal / EUDR"
        title="Una sola verdad de trazabilidad. Dos formas de convertirla en valor."
        copy="EUDR conecta el contexto territorial de Nature Intelligence con los controles, responsables y procesos de Enterprise Operations."
        signal="Parcela → lote → custodia → riesgo → dossier → certificado"
        tone="eudr"
      />

      <section className="section dual-entry-section">
        <div className="shell">
          <div className="section-heading">
            <span className="eyebrow">Doble entrada comercial</span>
            <h2>Mismo servicio. Diferente problema de negocio.</h2>
          </div>
          <div className="dual-entry-grid">
            <article className="entry-card entry-nature">
              <GlobeIcon />
              <span>Desde Nature</span>
              <h3>¿Qué ocurre en el territorio?</h3>
              <p>
                Geolocalización, Copernicus, provenance, riesgo de deforestación y evidencia
                ambiental vinculada a la parcela.
              </p>
              <Link className="text-link" href="/solutions/nature-intelligence">
                Ver Nature Intelligence <ArrowRight />
              </Link>
            </article>
            <div className="shared-core">
              <span>Una implementación</span>
              <strong>EUDR</strong>
              <small>Estado autoritativo por empresa</small>
            </div>
            <article className="entry-card entry-enterprise">
              <WorkflowIcon />
              <span>Desde Enterprise</span>
              <h3>¿Cómo demuestra cumplimiento la empresa?</h3>
              <p>
                Proveedores, custodia, debida diligencia, aprobaciones, auditoría y evidencia
                preparada para compradores y reguladores.
              </p>
              <Link className="text-link" href="/solutions/enterprise">
                Ver Enterprise Operations <ArrowRight />
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="section eudr-lifecycle">
        <div className="shell">
          <div className="section-heading split-heading">
            <div>
              <span className="eyebrow">Ciclo de cumplimiento</span>
              <h2>De la parcela al certificado sin romper la cadena de evidencia.</h2>
            </div>
            <p>
              Symmetry registra estados materiales on-chain y conserva documentos, geometrías
              y análisis fuera de la cadena mediante manifests verificables.
            </p>
          </div>
          <div className="lifecycle-track">
            {[
              ["01", "Actores"],
              ["02", "Parcelas"],
              ["03", "Lotes"],
              ["04", "Custodia"],
              ["05", "Riesgo"],
              ["06", "Certificado"],
            ].map(([number, label]) => (
              <div key={number}>
                <span>{number}</span>
                <strong>{label}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section eudr-assurance">
        <div className="shell assurance-grid">
          <div>
            <span className="eyebrow eyebrow-light">Qué preservamos</span>
            <h2>No solo el resultado. También el camino que produjo el resultado.</h2>
          </div>
          <div className="check-list">
            {[
              "Identidad de actores y autoridad de validación",
              "Geometrías y fuentes ambientales declaradas",
              "Transferencias de custodia y cambios de estado",
              "Versión del dossier y evidencia utilizada",
              "Emisión, vigencia y revocación del certificado",
            ].map((item) => (
              <div key={item}>
                <CheckIcon />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section next-solution">
        <div className="shell next-solution-inner">
          <span>Diseñemos tu ruta de cumplimiento</span>
          <Link href="/contact">
            Solicitar diagnóstico EUDR <ArrowRight />
          </Link>
        </div>
      </section>
    </>
  );
}
