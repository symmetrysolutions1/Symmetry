import type { Metadata } from "next";
import Link from "next/link";
import { SolutionHero } from "@/components/solution-hero";
import { ArrowRight, CheckIcon, ShieldIcon, VoteIcon, WorkflowIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Enterprise Operations",
  description:
    "Gobernanza, automatización y compliance verificables para operaciones empresariales.",
};

export default function EnterprisePage() {
  return (
    <>
      <SolutionHero
        eyebrow="Cascade 02 / Enterprise Operations"
        title="Procesos críticos que conservan quién decidió, por qué y bajo qué autoridad."
        copy="VotoID y Automation convierten decisiones, aprobaciones y controles en una historia operacional verificable. EUDR añade compliance cuando la cadena de suministro lo requiere."
        signal="Identidad → autoridad → proceso → decisión → auditoría"
        tone="enterprise"
      />

      <section className="section solution-intro">
        <div className="shell solution-intro-grid">
          <div>
            <span className="eyebrow">Infraestructura por empresa</span>
            <h2>Un root independiente. Solo los servicios contratados.</h2>
          </div>
          <div className="large-copy">
            <p>
              Cada compañía recibe su propia infraestructura institucional, con identidad,
              multisig, permisos, evidencia y auditoría. Symmetry opera la Factory, pero la
              empresa no comparte estado on-chain con otros clientes.
            </p>
          </div>
        </div>
      </section>

      <section className="section enterprise-products">
        <div className="shell product-stack">
          <article className="product-row">
            <div className="product-number">01</div>
            <div className="product-icon">
              <VoteIcon />
            </div>
            <div>
              <span className="eyebrow">VotoID</span>
              <h3>Gobernanza corporativa verificable.</h3>
              <p>
                Juntas, miembros, propuestas, quórum, snapshots, votos, ejecución y evidencia
                con reglas que pueden inspeccionarse.
              </p>
            </div>
          </article>
          <article className="product-row">
            <div className="product-number">02</div>
            <div className="product-icon">
              <WorkflowIcon />
            </div>
            <div>
              <span className="eyebrow">Automation</span>
              <h3>Procesos que no pierden su trazabilidad.</h3>
              <p>
                Plantillas, checkpoints, aprobaciones, attestations, escalamiento y cierre
                conectados con sistemas empresariales.
              </p>
            </div>
          </article>
          <article className="product-row">
            <div className="product-number">03</div>
            <div className="product-icon">
              <ShieldIcon />
            </div>
            <div>
              <span className="eyebrow">Resolve integration</span>
              <h3>Un agente operativo con límites institucionales.</h3>
              <p>
                Resolve puede recibir y ejecutar tickets autorizados mediante Automation, sin
                adquirir roles administrativos ni autoridad de upgrade.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="section use-case-section enterprise-use-cases">
        <div className="shell use-case-grid">
          <div className="use-case-lead">
            <span className="eyebrow eyebrow-light">Diseñado para control real</span>
            <h2>La automatización no reemplaza autoridad. La hace explícita.</h2>
          </div>
          <div className="check-list">
            {[
              "Juntas directivas y decisiones reguladas",
              "Aprobaciones financieras y documentales",
              "Controles de proveedores y compliance EUDR",
              "Integraciones ERP con checkpoints verificables",
              "Agentes operativos con permisos mínimos",
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
          <span>Explora el servicio regulatorio compartido</span>
          <Link href="/solutions/eudr">
            EUDR para Enterprise <ArrowRight />
          </Link>
        </div>
      </section>
    </>
  );
}
