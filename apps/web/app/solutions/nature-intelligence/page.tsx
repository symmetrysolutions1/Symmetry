import type { Metadata } from "next";
import Link from "next/link";
import { SolutionHero } from "@/components/solution-hero";
import { NaturePilotConsole } from "@/components/nature-pilot-console";
import {
  ArrowRight,
  CheckIcon,
  GlobeIcon,
  LayersIcon,
  LeafIcon,
  ShieldIcon,
} from "@/components/icons";
import { NatureCopernicusViewer } from "@/components/nature-copernicus-viewer";

export const metadata: Metadata = {
  title: "Nature Intelligence",
  description:
    "Observación territorial, Copernicus, alertas y evidencia ambiental verificable.",
};

export default function NatureIntelligencePage() {
  return (
    <div className="nature-intelligence-page">
      <SolutionHero
        eyebrow="Cascade 01 / Nature Intelligence"
        title="Nature Intelligence"
        copy="De la observación satelital del territorio a una evidencia defendible con verificación y trazabilidad."
        signal="Territorio → observación → alerta → validación → evidencia"
        tone="nature"
      />

      <section className="section solution-intro">
        <div className="shell solution-intro-grid">
          <div>
            <span className="eyebrow">Capacidad operacional</span>
            <h2>Usamos verificaciones satelitales para demostrar impacto medioambiental.</h2>
          </div>
          <div className="large-copy">
            <p>
              Nature Intelligence combina verificaciones Sentinel-2, geometría territorial y
              validación humana para demostrar cambios ambientales con contexto. Conservamos la
              fuente, el método, la observación, la geometría y la evidencia que respaldan cada
              decisión sobre el Parque Tayrona.
            </p>
          </div>
        </div>
      </section>

      <section className="section feature-band feature-band-nature">
        <div className="shell feature-grid nature-feature-grid">
          {[
            {
              icon: <GlobeIcon />,
              title: "Parque Tayrona",
              copy: "Asset territorial, geometría oficial y contexto operativo para cada observación.",
            },
            {
              icon: <LeafIcon />,
              title: "Copernicus",
              copy: "Descubrimiento Sentinel-2, series NDVI y fuentes geoespaciales declaradas.",
            },
            {
              icon: <ShieldIcon />,
              title: "Evidence passports",
              copy: "Provenance, hashes, decisiones y referencias listas para auditoría.",
            },
            {
              icon: <LayersIcon />,
              title: "Alertas tipadas",
              copy: "NDVI, vegetación, agua e incendio como señales diferenciadas y revisables.",
            },
          ].map((feature) => (
            <article className="feature-item" key={feature.title}>
              <div>{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section workflow-section">
        <div className="shell">
          <div className="section-heading split-heading">
            <div>
              <span className="eyebrow">Flujo Nature</span>
              <h2>Una cadena de observación con contexto y autoridad.</h2>
            </div>
            <p>
              Los datos geoespaciales permanecen off-chain. Symmetry ancla los digests,
              estados y eventos materiales para que el historial pueda reconstruirse.
            </p>
          </div>
          <div className="timeline-grid nature-timeline-grid">
            {[
              ["01", "Registrar", "Territorio, organización, propósito y política de monitoreo."],
              ["02", "Observar", "Escenas Sentinel-2 y fuentes empresariales o de campo."],
              ["03", "Analizar", "NDVI, cambios declarados, umbrales y señales de riesgo."],
              ["04", "Validar", "Revisión territorial, contexto y autoridad responsable."],
              ["05", "Preservar", "Pasaporte, replicación y anchor criptográfico."],
            ].map(([number, title, copy]) => (
              <article className="timeline-card" key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <NatureCopernicusViewer />

      <NaturePilotConsole />

      <section className="section use-case-section">
        <div className="shell use-case-grid">
          <div className="use-case-lead">
            <span className="eyebrow eyebrow-light">Dónde genera valor</span>
            <h2>Una interfaz ambiental conectada con la operación real.</h2>
          </div>
          <div className="check-list">
            {[
              "Riesgo de deforestación y debida diligencia EUDR",
              "Seguimiento de conservación y restauración",
              "Evidencia para compradores, fondos y auditores",
              "Monitoreo territorial con validación humana",
              "Provenance para reportes ambientales",
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
          <span>Continúa con el componente regulatorio</span>
          <Link href="/solutions/eudr">
            EUDR verificable <ArrowRight />
          </Link>
        </div>
      </section>
    </div>
  );
}
