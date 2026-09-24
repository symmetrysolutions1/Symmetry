import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  GlobeIcon,
  LayersIcon,
  LeafIcon,
  ShieldIcon,
  WorkflowIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "Nuestros servicios",
  description:
    "Explora las soluciones de Symmetry para proteger la naturaleza, demostrar el origen y operar con evidencia verificable.",
};

const services = [
  {
    number: "01",
    name: "Nature Intelligence",
    family: "Inteligencia ambiental verificable",
    headline: "El territorio habla. Tu equipo puede entenderlo.",
    copy: "Conectamos observación satelital, contexto territorial y validación humana para convertir cambios ambientales en señales que orientan decisiones.",
    proof: "Focos térmicos · cobertura vegetal · territorio",
    href: "/nature-intelligence",
    action: "Explorar Nature Intelligence",
    tone: "nature",
    Icon: GlobeIcon,
  },
  {
    number: "02",
    name: "EUDR & trazabilidad",
    family: "Origen y debida diligencia",
    headline: "Del origen del producto a una historia demostrable.",
    copy: "Vinculamos parcelas, proveedores, custodia y evidencia ambiental para que cada operación pueda responder con claridad a las exigencias del mercado europeo.",
    proof: "Parcela · lote · custodia · dossier",
    href: "/eudr",
    action: "Explorar EUDR",
    tone: "eudr",
    Icon: LeafIcon,
  },
  {
    number: "03",
    name: "Enterprise Operations",
    family: "Operación y gobernanza confiables",
    headline: "Decisiones críticas con responsables y contexto.",
    copy: "Hacemos visibles las reglas, autorizaciones y decisiones que sostienen procesos empresariales para que cada paso pueda reconstruirse y auditarse.",
    proof: "Identidad · autoridad · proceso · auditoría",
    href: "/enterprise",
    action: "Explorar Enterprise",
    tone: "enterprise",
    Icon: WorkflowIcon,
  },
  {
    number: "04",
    name: "Asset Layer",
    family: "Trazabilidad verificable de activos",
    headline: "Cada lote conserva el camino que recorrió.",
    copy: "Registramos origen, custodia, verificación y transformación de activos físicos en una historia digital que ayuda a prevenir pérdidas y dobles conteos.",
    proof: "Registrar · verificar · transformar · certificar",
    href: "/asset-layer",
    action: "Explorar Asset Layer",
    tone: "asset",
    Icon: LayersIcon,
  },
] as const;

export default function ServicesPage() {
  return (
    <div className="sym-page sym-services-page">
      <section className="sym-services-hero">
        <div className="sym-grid-field" aria-hidden="true" />
        <div className="sym-shell sym-services-hero-layout">
          <div className="sym-services-hero-copy">
            <span className="sym-kicker"><i /> Nuestros servicios</span>
            <h1>
              Lo que ocurre
              <em>puede demostrarse.</em>
            </h1>
            <p>
              De un cambio en el territorio a una decisión empresarial, Symmetry conecta
              información del mundo real con procesos y evidencia verificable.
            </p>
            <a className="sym-services-scroll" href="#soluciones">
              Explora las soluciones <ArrowRight />
            </a>
          </div>
          <div className="sym-services-hero-art" aria-label="Cuatro soluciones conectadas por evidencia confiable">
            <div className="sym-services-art-orbit orbit-one" />
            <div className="sym-services-art-orbit orbit-two" />
            <div className="sym-services-art-core"><ShieldIcon /><span>SYMMETRY</span><small>EVIDENCIA QUE CONECTA</small></div>
            <span className="sym-services-art-label label-nature">TERRITORIO</span>
            <span className="sym-services-art-label label-eudr">ORIGEN</span>
            <span className="sym-services-art-label label-enterprise">DECISIONES</span>
            <span className="sym-services-art-label label-asset">ACTIVOS</span>
          </div>
        </div>
        <div className="sym-shell sym-services-hero-foot">
          <span>UNA PLATAFORMA</span><i /><span>CUATRO FORMAS DE GENERAR CONFIANZA</span>
        </div>
      </section>

      <section className="sym-service-catalog" id="soluciones">
        <div className="sym-shell">
          <div className="sym-service-catalog-heading">
            <div>
              <span className="sym-kicker"><i /> Encuentra tu punto de partida</span>
              <h2>Una solución para cada realidad.</h2>
            </div>
            <p>
              Entra por el reto que tienes hoy. Las soluciones comparten una base de
              identidad, permisos y evidencia, y se conectan cuando tu operación lo necesita.
            </p>
          </div>

          <div className="sym-service-catalog-grid">
            {services.map(({ Icon, ...service }) => (
              <Link
                className={`sym-service-card sym-service-card-${service.tone}`}
                href={service.href}
                key={service.number}
              >
                <div className="sym-service-card-top">
                  <span>{service.number} / {service.family}</span>
                  <ArrowUpRight />
                </div>
                <div className="sym-service-card-art" aria-hidden="true">
                  <div className="sym-service-card-orbit"><i /><i /><i /></div>
                  <Icon />
                </div>
                <div className="sym-service-card-copy">
                  <h3>{service.name}</h3>
                  <h4>{service.headline}</h4>
                  <p>{service.copy}</p>
                  <span className="sym-service-card-proof">{service.proof}</span>
                </div>
                <div className="sym-service-card-action">{service.action}<ArrowRight /></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="sym-services-promise">
        <div className="sym-shell sym-services-promise-layout">
          <span className="sym-kicker"><i /> Una misma base de confianza</span>
          <h2>Ver lo que cambia.<br />Entender qué significa.<br /><em>Demostrar qué hiciste.</em></h2>
          <p>
            La evidencia se construye desde la fuente, se interpreta con contexto y conserva
            las decisiones de las personas autorizadas. Así, la tecnología acompaña la
            operación y la organización mantiene el control.
          </p>
          <Link className="sym-button sym-button-outline" href="/trust-layer">
            Conoce la Trust Layer <ArrowRight />
          </Link>
        </div>
      </section>
    </div>
  );
}
