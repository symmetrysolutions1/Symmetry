import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";

export const metadata: Metadata = {
  title: "Asset Layer",
  description: "Infraestructura empresarial para registrar y verificar activos físicos, ambientales y productivos.",
};

const stages = [
  ["01", "Registrar", "Un lote, su cantidad, origen, custodio y evidencia inicial."],
  ["02", "Verificar", "Un tercero autorizado confirma existencia, peso, calidad y procedencia."],
  ["03", "Transformar", "La entrada se relaciona con salidas y rechazo mediante balance de masa."],
  ["04", "Certificar", "Un certificado verificable resume el historial y los documentos autorizados."],
  ["05", "Retirar", "El activo se cierra para impedir doble conteo o reutilización indebida."],
];

export default function AssetLayerPage() {
  return (
    <>
      <section className="asset-service-hero">
        <div className="shell asset-service-hero-grid">
          <div>
            <span className="eyebrow">Symmetry / Enterprise Asset Layer</span>
            <h1>La evidencia de un activo también puede tener memoria.</h1>
            <p>Symmetry convierte activos físicos y productivos en registros digitales verificables, trazables y programables. LazosTech es el primer root empresarial del piloto.</p>
            <div className="hero-actions"><Link className="button button-accent" href="/lazostech/asset-layer">Abrir consola piloto <ArrowRight /></Link><Link className="button button-ghost-light" href="/contact">Diseñar implementación</Link></div>
          </div>
          <div className="asset-service-orbit" aria-label="Ciclo de un lote verificable"><span>REGISTER</span><span>VERIFY</span><span>TRANSFORM</span><span>CERTIFY</span><strong>ALU<br />500 kg</strong></div>
        </div>
      </section>
      <section className="section asset-service-intro"><div className="shell asset-service-intro-grid"><div><span className="eyebrow">Primer producto</span><h2>Un pasaporte digital antes que un instrumento financiero.</h2></div><p>La primera capa no promete rentabilidad ni divide utilidades. Documenta qué existe, quién lo custodia, quién lo verificó, qué transformaciones ocurrieron y cuándo el activo fue cerrado.</p></div></section>
      <section className="section asset-service-stages"><div className="shell"><div className="section-heading"><span className="eyebrow">Lifecycle verificable</span><h2>Del lote físico al certificado sin perder el camino.</h2></div><div className="asset-stage-grid">{stages.map(([number, title, copy]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>
      <section className="section asset-service-scope"><div className="shell asset-service-scope-grid"><div><span className="eyebrow eyebrow-light">Scope del piloto</span><h2>Latas de aluminio → aluminio reciclado.</h2><p>El MVP de LazosTech prioriza latas de aluminio, conserva PET como material soportado y mantiene una regla auditable: entrada = salida aprovechable + rechazo.</p></div><div className="asset-scope-list"><div><strong>Prioridad</strong><span>ALUMINUM_POST_CONSUMER</span></div><div><strong>Producto</strong><span>ALUMINUM_RECYCLED_INGOT</span></div><div><strong>También soportado</strong><span>PET_POST_CONSUMER → PET_RECYCLED_FLAKE</span></div><div><strong>Roadmap</strong><span>HDPE · cartón · aceite · e-waste</span></div></div></div></section>
      <section className="section next-solution"><div className="shell next-solution-inner"><span>Primer root: LazosTech</span><Link href="/lazostech/asset-layer">Ver consola empresarial <ArrowRight /></Link></div></section>
    </>
  );
}
