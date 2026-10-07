import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { SolutionHero } from "@/components/solution-hero";
import { EnterprisePortfolioCarousel } from "./portfolio-carousel";
import { EnterpriseAssetFeature } from "./asset-layer-feature";

export const metadata: Metadata = {
  title: "Enterprise Operations",
  description:
    "Roots empresariales independientes que conectan Asset Layer, gobernanza, automatización, EUDR y agentes operativos con identidad y evidencia verificable.",
};

const cases = [
  {
    number: "01",
    label: "Primer root empresarial / Asset Layer",
    title: "LazosTech · ciclo de vida de materiales",
    copy: "Un entorno controlado para registrar activos, verificar existencia y peso, seguir custodia, aplicar balance de masa y conservar la evidencia del material transformado.",
    status: "Piloto controlado · Base Sepolia",
    href: "https://www.lazostech.com/we",
    action: "Visitar LazosTech",
  },
  {
    number: "02",
    label: "Caso de estudio independiente",
    title: "Auditoría Popular / E14",
    copy: "Ingesta de formularios, extracción asistida por OCR, revisión humana, detección de inconsistencias, manifests canónicos y anclaje de evidencia.",
    status: "Prueba de operación · no es un servicio Symmetry",
    href: "https://presidencia2026.vercel.app/",
    action: "Abrir Auditoría Popular",
  },
  {
    number: "03",
    label: "Flujos empresariales verificables",
    title: "VotoID · Automation · EUDR",
    copy: "Flujos E2E locales y de testnet que muestran cómo identidad, permisos, estados de servicio, evidencia y auditoría conviven por empresa.",
    status: "Implementado y probado · producción sujeta a gates",
    href: "/proof",
    action: "Revisar infraestructura",
  },
];

export default function EnterprisePage() {
  return (
    <>
      <SolutionHero
        eyebrow="Cascade 03 / Enterprise Operations"
        title="Automatización y trazabilidad en blockchain para empresas."
        copy="Enterprise Operations conecta activos, evidencia, procesos y decisiones en una infraestructura empresarial con identidad, permisos y trazabilidad verificable."
        signal="Activo · evidencia · proceso · decisión"
        tone="enterprise"
        showActions={false}
        showSignalGraph={false}
        compactSignal
      />

      <EnterpriseAssetFeature />

      <section className="section enterprise-portfolio">
        <div className="shell">
          <div className="enterprise-portfolio-heading">
            <div>
              <span className="eyebrow">El portafolio Enterprise Operations</span>
              <h2>Roots empresariales independientes sobre servicios y soluciones.</h2>
            </div>
            <p>
              Cada empresa conserva un root propio; desde ahí conecta servicios y soluciones con
              su identidad, permisos y evidencia, sin mezclar operaciones entre organizaciones.
            </p>
          </div>
          <EnterprisePortfolioCarousel />
        </div>
      </section>

      <section className="section enterprise-cases">
        <div className="shell">
          <div className="enterprise-cases-heading">
            <span className="eyebrow eyebrow-light">Casos y evidencia de operación</span>
            <h2>Lo que ya hemos construido alrededor de la misma capa de confianza.</h2>
          </div>
          <div className="enterprise-case-list">
            {cases.map(({ number, label, title, copy, status, href, action }) => (
              <article className="enterprise-case-row" key={number}>
                <span className="enterprise-case-number">{number}</span>
                <div className="enterprise-case-main">
                  <span className="case-label">{label}</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
                <div className="enterprise-case-meta">
                  <span>{status}</span>
                  <Link
                    href={href}
                    target={href.startsWith("https://") ? "_blank" : undefined}
                    rel={href.startsWith("https://") ? "noreferrer" : undefined}
                  >
                    {action} <ArrowRight />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section enterprise-system-cta">
        <div className="shell enterprise-system-cta-inner">
          <div>
            <span className="eyebrow">Del portafolio al sistema</span>
            <h2>Revisa la arquitectura, la evidencia y el estado actual de nuestra infraestructura.</h2>
          </div>
          <Link className="button button-accent" href="/proof">Ver nuestro sistema <ArrowRight /></Link>
        </div>
      </section>
    </>
  );
}
