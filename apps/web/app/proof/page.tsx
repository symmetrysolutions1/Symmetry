import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckIcon, LayersIcon, ShieldIcon } from "@/components/icons";
import { proofMetrics } from "@/lib/content";

export const metadata: Metadata = {
  title: "Verificación",
  description:
    "Arquitectura, testnet y modelo de evidencia verificable de Symmetry Enterprises.",
};

export default function ProofPage() {
  return (
    <>
      <section className="proof-hero">
        <div className="shell proof-hero-grid">
          <div>
            <span className="eyebrow eyebrow-light">Verificación / no confianza ciega</span>
            <h1>La evidencia de nuestra infraestructura también debe poder inspeccionarse.</h1>
          </div>
          <div className="proof-orbit-large" aria-hidden="true">
            <span />
            <span />
            <span />
            <i />
          </div>
        </div>
      </section>

      <section className="section proof-metrics-page">
        <div className="shell metrics-grid">
          {proofMetrics.map((metric) => (
            <div className="metric-card" key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section architecture-section">
        <div className="shell architecture-grid">
          <div>
            <span className="eyebrow">Modelo institucional</span>
            <h2>Una empresa no vive dentro de Symmetry. Recibe su propia infraestructura.</h2>
            <p>
              La Factory despliega un root independiente por organización. Identidad,
              permisos, servicios, evidencia y auditoría permanecen separados de los demás
              clientes.
            </p>
          </div>
          <div className="architecture-stack">
            {[
              ["04", "Servicios", "VotoID · Automation · EUDR"],
              ["03", "Trust layer", "Identity · Access · Evidence · Audit"],
              ["02", "Company root", "SymmetryDiamond independiente"],
              ["01", "Factory", "Provisionamiento y governance controlados"],
            ].map(([number, title, copy]) => (
              <div key={number}>
                <span>{number}</span>
                <strong>{title}</strong>
                <small>{copy}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section permanence-section">
        <div className="shell">
          <div className="section-heading split-heading">
            <div>
              <span className="eyebrow">Persistencia por diseño</span>
              <h2>Una evidencia, varias rutas independientes de recuperación.</h2>
            </div>
            <p>
              Ningún proveedor se presenta como indestructible. La resiliencia surge de
              redundancia, manifests, health checks y reparación.
            </p>
          </div>
          <div className="permanence-grid">
            {[
              ["Operacional", "Disponibilidad inmediata y control empresarial"],
              ["IPFS", "Contenido direccionado por hash y múltiples pinning targets"],
              ["Filecoin", "Replicación contractual y renovación de almacenamiento"],
              ["Arweave", "Archivo de largo plazo para evidencia final"],
              ["EVM anchor", "Digest, identidad, estado y evento de auditoría"],
            ].map(([title, copy], index) => (
              <article key={title}>
                <span>0{index + 1}</span>
                <LayersIcon />
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section validation-section">
        <div className="shell validation-grid">
          <div className="validation-card">
            <ShieldIcon />
            <span className="eyebrow eyebrow-light">Estado actual</span>
            <h2>Base Sepolia validado. Producción todavía protegida por gates.</h2>
          </div>
          <div className="check-list">
            {[
              "Factory y roots verificados en explorer",
              "VotoID, Automation y EUDR con flujos E2E",
              "Eventos indexados y receipts registrados",
              "Mainnet pendiente de multisig, proveedores reales y auditoría externa",
            ].map((item) => (
              <div key={item}>
                <CheckIcon />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section case-study-section">
        <div className="shell case-study-grid">
          <div>
            <span className="eyebrow">Prueba de operación independiente</span>
            <h2>Testigos Digitales / E14</h2>
          </div>
          <div>
            <p>
              El piloto procesó formularios electorales, combinó OCR con revisión humana,
              detectó inconsistencias y produjo evidencia canónica con publicación
              direccionada por contenido y anclaje blockchain.
            </p>
            <p className="case-disclaimer">
              El anclaje demuestra integridad y publicación. No convierte automáticamente una
              inconsistencia en fraude ni sustituye a la autoridad electoral.
            </p>
            <Link className="text-link" href="/contact">
              Aplicar el modelo a otro proceso <ArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
