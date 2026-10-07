import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";

export const metadata: Metadata = {
  title: "Asset Layer - Radian",
  description:
    "Infraestructura empresarial para registrar y verificar activos físicos, ambientales y productivos.",
};

const stages = [
  ["01", "Registrar", "Identidad del lote y evidencia."],
  ["02", "Trazar", "Custodia y transferencias."],
  ["03", "Transformar", "Balance entre entradas y salidas."],
  ["04", "Medir", "Datos para evaluar el impacto."],
  ["05", "Respaldar", "Expediente para revisión."],
];

export default function AssetLayerPage() {
  return (
    <>
      <section className="asset-service-hero">
        <div className="shell asset-service-hero-grid">
          <div>
            <span className="eyebrow">Cascade 03.1 | Asset enterprise layer</span>
            <h1>
              Activos digitales en título valor con respaldo verificable en blockchain.
            </h1>
            <p>
              Asset Layer convierte activos físicos en un pasaporte digital verificable en blockchain:
              origen, custodia, transformación y retorno a la cadena productiva.
            </p>
          </div>
          <div className="asset-process-ribbon" aria-label="Procesos de seguimiento del activo">
            <div className="asset-process-layer asset-process-origin">
              <span>01</span><strong>ORIGEN</strong><small>Identidad del material</small>
            </div>
            <div className="asset-process-layer asset-process-custody">
              <span>02</span><strong>CUSTODIA</strong><small>Transferencia operativa</small>
            </div>
            <div className="asset-process-layer asset-process-transform">
              <span>03</span><strong>TRANSFORMACIÓN</strong><small>Balance transformado</small>
            </div>
            <div className="asset-process-layer asset-process-proof">
              <span>04</span><strong>EVIDENCIA</strong><small>Verificación en cadena (on-chain)</small>
            </div>
            <div className="asset-process-layer asset-process-return">
              <span>05</span><strong>RETORNO</strong><small>Cadena productiva</small>
            </div>
          </div>
        </div>
      </section>
      <div className="asset-blue-strip" aria-label="Cadena verificable del activo">
        <div className="shell asset-blue-strip-inner">
          <span>ASSET LAYER / VERIFIED PATH</span>
          <strong>ORIGEN <i>→</i> CUSTODIA <i>→</i> TRANSFORMACIÓN <i>→</i> RETORNO</strong>
        </div>
      </div>
      <section className="section asset-service-intro">
        <div className="shell asset-service-intro-grid">
          <div>
            <span className="eyebrow">Títulos valor en RADIAN</span>
            <h2>Un pasaporte digital que nos puede servir como instrumento financiero.</h2>
          </div>
          <p>
            El pasaporte reúne identidad, custodia, transformaciones y soportes para que un activo
            pueda evaluarse en una futura estructuración financiera. Su uso como título valor
            depende de los requisitos legales y de su validación; RADIAN aporta el contexto de
            registro y consulta de eventos de factura electrónica.
          </p>
        </div>
      </section>
      <section className="section asset-service-stages">
        <div className="shell">
          <div className="section-heading">
            <span className="eyebrow">Lifecycle verificable</span>
            <h2>El lote físico se convierte en un certificado de impacto climático.</h2>
            <p className="asset-lifecycle-note">
              La trazabilidad conserva la evidencia del lote; la medición y validación del impacto
              requieren una metodología aplicable.
            </p>
          </div>
          <div className="asset-stage-grid asset-stage-ribbon">
            {stages.map(([number, title, copy]) => (
              <article key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section asset-service-scope">
        <div className="shell asset-service-scope-grid">
          <div>
            <span className="eyebrow eyebrow-light">Scope del piloto</span>
            <h2>Latas de aluminio → aluminio reciclado.</h2>
            <p>
              El MVP de LazosTech prioriza latas de aluminio, conserva PET como material soportado
              y mantiene una regla auditable: entrada = salida aprovechable + rechazo.
            </p>
          </div>
          <div className="asset-scope-list">
            <div><strong>Prioridad</strong><span>ALUMINUM_POST_CONSUMER</span></div>
            <div><strong>Producto</strong><span>ALUMINUM_RECYCLED_INGOT</span></div>
            <div><strong>También soportado</strong><span>PET_POST_CONSUMER → PET_RECYCLED_FLAKE</span></div>
            <div><strong>Roadmap</strong><span>HDPE · cartón · aceite · e-waste</span></div>
          </div>
        </div>
      </section>
      <section className="section next-solution">
        <div className="shell next-solution-inner">
          <span>Primer root: LazosTech</span>
          <Link href="/lazostech/asset-layer">Ver consola empresarial <ArrowRight /></Link>
        </div>
      </section>
    </>
  );
}
