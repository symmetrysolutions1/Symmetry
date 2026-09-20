"use client";

import { useState } from "react";
import Link from "next/link";

const alertTypes = [
  {
    id: "ndvi_drop",
    label: "Caída de NDVI",
    description: "Señal de disminución en la salud de la vegetación.",
  },
  {
    id: "vegetation_loss",
    label: "Pérdida de vegetación",
    description: "Cambio compatible con una reducción de cobertura vegetal.",
  },
  {
    id: "water_change",
    label: "Cambio de agua",
    description: "Variación observada en la señal de humedad o agua.",
  },
  {
    id: "fire_signal",
    label: "Señal de incendio",
    description: "Señal satelital que requiere validación territorial.",
  },
];

const flowSteps = [
  ["01", "Asset registrado", "CO-TAYRONA-PNN-001", "done"],
  ["02", "Observación", "Sentinel-2 / Copernicus", "done"],
  ["03", "Alerta tipada", "Comparación por señales", "active"],
  ["04", "Evidencia", "Manifiesto + digest", "ready"],
  ["05", "Anclaje HSK", "Esperando transaction hash", "pending"],
] as const;

export function NaturePilotConsole() {
  const [selectedAlert, setSelectedAlert] = useState(alertTypes[0]);
  const [reviewStarted, setReviewStarted] = useState(false);

  return (
    <section className="section nature-pilot-section" id="tayrona-pilot">
      <div className="shell">
        <div className="section-heading split-heading nature-pilot-heading">
          <div>
            <span className="eyebrow">Piloto Tayrona / Sentinel</span>
            <h2>Una señal territorial que puede seguirse hasta su evidencia.</h2>
          </div>
          <p>
            Esta vista conecta el asset oficial de Tayrona con la observación Sentinel-2,
            una alerta legible y el punto exacto donde Áureo podrá anclar su digest en HSK.
          </p>
        </div>

        <div className="nature-pilot-console">
          <div className="nature-pilot-console-topline">
            <div>
              <span className="nature-pilot-kicker">NATURE INTELLIGENCE / LIVE PILOT</span>
              <h3>Parque Nacional Natural Tayrona</h3>
            </div>
            <span className="nature-status-badge">
              <i aria-hidden="true" /> Revisión preparada
            </span>
          </div>

          <div className="nature-pilot-grid nature-pilot-grid-single">
            <article className="nature-signal-card">
              <div className="nature-card-label">Señal en revisión</div>
              <div className="nature-signal-header">
                <div>
                  <span className="nature-signal-source">COPERNICUS / SENTINEL-2</span>
                  <strong>{selectedAlert.label}</strong>
                </div>
                <span className="nature-signal-severity">SEÑAL</span>
              </div>
              <p>{selectedAlert.description}</p>
              <div className="nature-alert-selector" aria-label="Tipos de alerta">
                {alertTypes.map((alert) => (
                  <button
                    className={alert.id === selectedAlert.id ? "is-selected" : ""}
                    key={alert.id}
                    type="button"
                    onClick={() => {
                      setSelectedAlert(alert);
                      setReviewStarted(false);
                    }}
                  >
                    {alert.label}
                  </button>
                ))}
              </div>
              <button
                className="nature-review-button"
                type="button"
                onClick={() => setReviewStarted(true)}
              >
                {reviewStarted ? "Revisión preparada" : "Preparar revisión"}
                <span aria-hidden="true">→</span>
              </button>
              <small>
                Señal de observación, no confirmación automática de deforestación o ilegalidad.
              </small>
            </article>
          </div>

          <div className="nature-flow-strip" aria-label="Estado del flujo de evidencia">
            {flowSteps.map(([number, title, detail, status]) => (
              <div className={`nature-flow-step nature-flow-${status}`} key={number}>
                <span>{number}</span>
                <div>
                  <strong>{title}</strong>
                  <small>{detail}</small>
                </div>
              </div>
            ))}
          </div>

          <div className="nature-pilot-footer">
            <span>
              <b>HSK Testnet</b> · El anclaje se mostrará cuando exista un recibo real de Blockscout.
            </span>
            <Link href="/proof">Ver modelo de evidencia <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
