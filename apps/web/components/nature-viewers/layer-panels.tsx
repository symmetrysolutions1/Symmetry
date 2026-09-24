"use client";

import { CALI_AOI } from "@/lib/nature-layers";

export function TerritoryPanel({ active }: { active: boolean }) {
  if (!active) return null;
  const { west, south, east, north, center, name } = CALI_AOI;
  const w = east - west;
  const h = north - south;
  const poly = [
    [west, south],
    [east, south],
    [east, north],
    [west, north],
    [west, south],
  ]
    .map(([x, y]) => `${40 + ((x - west) / w) * 520},${320 - ((y - south) / h) * 260}`)
    .join(" ");

  return (
    <div className="ni-viewer-shell">
      <aside className="ni-viewer-side">
        <p className="ni-viewer-kicker">Registry</p>
        <h3>{name}</h3>
        <p>Polígono AOI operativo. Todas las capas satelitales se recortan a este territorio.</p>
        <div className="ni-stats">
          <div><span>Oeste</span><strong>{west}</strong></div>
          <div><span>Sur</span><strong>{south}</strong></div>
          <div><span>Este</span><strong>{east}</strong></div>
          <div><span>Norte</span><strong>{north}</strong></div>
        </div>
        <p className="ni-muted">Centro [{center[0]}, {center[1]}]</p>
      </aside>
      <div className="ni-svg-wrap">
        <svg viewBox="0 0 600 360" role="img" aria-label="Territorio AOI">
          <rect width="600" height="360" fill="#0b1612" />
          <path d="M0 80 C180 20 380 140 600 60 V360 H0Z" fill="#123028" />
          <polygon points={poly} fill="rgba(215,255,95,0.35)" stroke="#d7ff5f" strokeWidth="3" />
          <circle cx={40 + ((center[0] - west) / w) * 520} cy={320 - ((center[1] - south) / h) * 260} r="6" fill="#ff6b3d" />
        </svg>
      </div>
    </div>
  );
}

export function AlertsPanel({ active }: { active: boolean }) {
  if (!active) return null;
  const alerts = [
    { id: "A-241", type: "fire_signal", severity: "high", status: "open", detail: "VIIRS ∩ territorio · score CONFIRM" },
    { id: "A-238", type: "ndvi_drop", severity: "medium", status: "open", detail: "ΔNDVI material en parcela norte" },
    { id: "A-230", type: "vegetation_loss", severity: "high", status: "validated", detail: "Validado por operador territorial" },
    { id: "A-219", type: "water_change", severity: "low", status: "dismissed", detail: "Descartado — nube / falso positivo" },
  ];
  return (
    <div className="ni-viewer-shell ni-viewer-shell-stack">
      <aside className="ni-viewer-side">
        <p className="ni-viewer-kicker">Human-in-the-loop</p>
        <h3>Cola de validación</h3>
        <p>Las capas no deciden solas. Cada señal entra como alerta tipada para validar o descartar.</p>
      </aside>
      <div className="ni-alert-board">
        {alerts.map((a) => (
          <article key={a.id} className={`ni-alert ni-alert-${a.severity}`}>
            <header>
              <span>{a.id}</span>
              <strong>{a.type}</strong>
              <em>{a.status}</em>
            </header>
            <p>{a.detail}</p>
            {a.status === "open" ? (
              <div className="ni-alert-actions">
                <button type="button">Validar</button>
                <button type="button" className="quiet">Descartar</button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

export function EvidencePanel({ active }: { active: boolean }) {
  if (!active) return null;
  const steps = [
    ["Fuente", "nasa-firms / Copernicus STAC"],
    ["Geometría", "Territorio GeoJSON + focos"],
    ["Decisión", "Alerta validada por operador"],
    ["Manifiesto", "Hash + metadata canónica"],
    ["Ancla", "Trust Layer / Base Sepolia"],
  ];
  return (
    <div className="ni-viewer-shell ni-viewer-shell-stack">
      <aside className="ni-viewer-side">
        <p className="ni-viewer-kicker">Evidence passport</p>
        <h3>La prueba no es la imagen</h3>
        <p>Symmetry preserva provenance: qué se vio, cómo, quién validó y qué digest quedó anclado.</p>
      </aside>
      <ol className="ni-evidence-rail">
        {steps.map(([title, copy], i) => (
          <li key={title}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <div>
              <strong>{title}</strong>
              <p>{copy}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function WaterPanel({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="ni-viewer-shell ni-viewer-shell-stack">
      <aside className="ni-viewer-side">
        <p className="ni-viewer-kicker">Roadmap</p>
        <h3>Water & hydrology</h3>
        <p>
          Misma arquitectura de capas: señal satelital → alerta `water_change` → validación →
          evidencia. Visor nativo en roadmap.
        </p>
      </aside>
      <div className="ni-roadmap">
        <p>Próximo: mosaicos SWIR / índices hídricos sobre el territorio registrado.</p>
        <ul>
          <li>Integración al hub de visores</li>
          <li>Misma API `/nature/.../layers`</li>
          <li>Sin actuación automática</li>
        </ul>
      </div>
    </div>
  );
}
