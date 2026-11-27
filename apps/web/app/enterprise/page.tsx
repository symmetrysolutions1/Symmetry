import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { SolutionHero } from "@/components/solution-hero";
import { EnterprisePortfolioCarousel } from "./portfolio-carousel";

export const metadata: Metadata = {
  title: "Operations para empresas y personas",
  description:
    "Diseñamos aplicaciones, interfaces y herramientas digitales que hacen más fácil la operación de empresas y personas.",
};

export default function EnterprisePage() {
  return (
    <>
      <SolutionHero
        eyebrow="OPERATIONS PARA EMPRESAS Y PERSONAS"
        title="Hacemos más fácil la vida de empresas y personas."
        copy="Diseñamos y desarrollamos aplicaciones, interfaces de usuario y herramientas digitales para que cada empresa o persona pueda hacer mejor lo que necesita hacer."
        signal="Aplicaciones · interfaces · operaciones"
        tone="enterprise"
        showActions={false}
        showSignalGraph={false}
        compactSignal
      />

      <section className="section enterprise-portfolio">
        <div className="shell">
          <div className="enterprise-portfolio-heading">
            <div>
              <span className="eyebrow">Casos de éxito</span>
              <h2>Ideas que ya convertimos en experiencias digitales.</h2>
            </div>
            <p>
              Desde aplicaciones a la medida hasta herramientas operativas, construimos soluciones
              que conectan las necesidades de las personas con las de cada organización.
            </p>
          </div>
          <EnterprisePortfolioCarousel />
          <p className="enterprise-case-note">
            Testigos Digitales / E14 es un proyecto independiente que compartimos como ejemplo de
            aplicación; no es un servicio de Symmetry.
          </p>
        </div>
      </section>

      <section className="section enterprise-system-cta">
        <div className="shell enterprise-system-cta-inner">
          <div>
            <span className="eyebrow">¿Qué necesitas hacer más fácil?</span>
            <h2>Construyamos la herramienta que tu operación necesita.</h2>
          </div>
          <Link className="button button-accent" href="/contact">Hablemos de tu proyecto <ArrowRight /></Link>
        </div>
      </section>
    </>
  );
}
