import Link from "next/link";
import { ArrowRight, GlobeIcon, LayersIcon, LeafIcon, ShieldIcon, WorkflowIcon } from "./icons";

const copernicusTayronaUrl =
  "https://browser.dataspace.copernicus.eu/?zoom=10&lat=11.31465&lng=-74.05402&themeId=DEFAULT-THEME&visualizationUrl=U2FsdGVkX1%2Fi%2FibUJ3RMXvMEsjJXQZbmcxQ4KmGCaZTGtX7GY2nD7B4iYBIw7Yl7yA%2FAt5G09NWbWgBhQCOjAIdpHJK3ZMilBhlwqwXkgGHKuvCicDd3dJ%2BkWfCTNtUf&datasetId=S2_L2A_CDAS&fromTime=2026-09-20T00%3A00%3A00.000Z&toTime=2026-09-20T23%3A59%3A59.999Z&layerId=3_NDVI&cloudCoverage=30&dateMode=SINGLE";

type SolutionHeroProps = {
  eyebrow: string;
  title: string;
  copy: string;
  signal: string;
  tone: "nature" | "enterprise" | "eudr";
};

export function SolutionHero({ eyebrow, title, copy, signal, tone }: SolutionHeroProps) {
  const isNature = tone === "nature";

  return (
    <section className={`solution-hero solution-${tone} ${isNature ? "nature-solution-hero" : ""}`}>
      <div className="shell solution-hero-grid">
        <div className={isNature ? "nature-solution-copy" : undefined}>
          {isNature ? <h1>{title}</h1> : <span className="eyebrow">{eyebrow}</span>}
          {isNature ? <span className="nature-hero-eyebrow">{eyebrow.replace(" / Nature Intelligence", " / Nature")}</span> : <h1>{title}</h1>}
          <p className="solution-lede">{copy}</p>
          <div className="hero-actions">
            <Link className="button button-light" href="/contact">
              Diseñar una implementación <ArrowRight />
            </Link>
            <Link className="button button-ghost-light" href="/proof">
              Ver infraestructura
            </Link>
          </div>
        </div>
        <div className={`solution-signal ${isNature ? "nature-signal" : ""}`} aria-label={signal}>
          {isNature ? (
            <>
                <div className="nature-mini-visor">
                  <div className="nature-visor-canvas">
                    <div className="nature-visor-preview" aria-label="Previsualización del asset Parque Tayrona">
                      <span className="nature-preview-kicker">Previsualización del asset</span>
                      <strong>Parque Tayrona</strong>
                      <span className="nature-preview-polygon" aria-hidden="true" />
                    </div>
                    <iframe
                      src={copernicusTayronaUrl}
                      title="Visor Copernicus Sentinel-2 del Parque Tayrona"
                      loading="eager"
                      referrerPolicy="no-referrer"
                    />
                    <div className="nature-visor-fallback nature-mini-fallback">
                      <span>Fuente externa / Sentinel-2</span>
                      <strong>Copernicus / NDVI</strong>
                      <a href={copernicusTayronaUrl} target="_blank" rel="noreferrer">
                        Abrir visor <span aria-hidden="true">↗</span>
                      </a>
                    </div>
                  </div>
                  <div className="nature-mini-visor-label">
                    <span>Sentinel-2 / NDVI</span>
                    <strong>Parque Tayrona</strong>
                </div>
              </div>
              <div className="nature-trace-heading">
                <span className="signal-label">Cadena de trazabilidad</span>
                <strong>De la señal a la evidencia</strong>
              </div>
              <div className="nature-trace-grid" aria-label={signal}>
                <TraceStep icon={<GlobeIcon />} label="Territorio" />
                <TraceStep icon={<LeafIcon />} label="Observación" />
                <TraceStep icon={<WorkflowIcon />} label="Alerta" />
                <TraceStep icon={<ShieldIcon />} label="Validación" />
                <TraceStep icon={<LayersIcon />} label="Evidencia" />
              </div>
              <div className="signal-meta">
                <span>Fuente declarada</span>
                <span>Integridad verificable</span>
              </div>
            </>
          ) : (
            <>
              <span className="signal-label">Señal operativa</span>
              <strong>{signal}</strong>
              <div className="signal-graph" aria-hidden="true">
                <i /><i /><i /><i /><i /><i /><i />
              </div>
              <div className="signal-meta">
                <span>Fuente declarada</span>
                <span>Integridad verificable</span>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function TraceStep({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="nature-trace-step">
      <span className="nature-trace-icon">{icon}</span>
      <strong>{label}</strong>
    </div>
  );
}
