"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { natureLayers, type NatureLayer, type NatureLayerId } from "@/lib/nature-layers";
import { FireMapViewer } from "@/components/nature-viewers/fire-map";
import { WorldSatelliteMap } from "@/components/nature-viewers/world-satellite-map";
import styles from "./nature-intelligence-hub.module.css";

const LAYER_SLUGS: Record<NatureLayerId, string> = {
  fire: "fire-risk",
  deforestation: "deforestation-lines",
  water: "water-flow",
};

function layerHref(id: NatureLayerId) {
  return `/nature-intelligence/${LAYER_SLUGS[id]}`;
}

function layerFromPath(pathname: string): NatureLayerId | null {
  return natureLayers.find((layer) => pathname === layerHref(layer.id))?.id ?? null;
}

function statusLabel(status: "live" | "pilot" | "roadmap") {
  if (status === "live") return "ACTIVA";
  if (status === "pilot") return "PILOTO";
  return "EN EXPLORACIÓN";
}

function WaterFlowMap() {
  const [showRivers, setShowRivers] = useState(true);
  const [showWaterBodies, setShowWaterBodies] = useState(true);
  const [showAtmosphericRivers, setShowAtmosphericRivers] = useState(false);

  return (
    <section className={`${styles.layerMap} ${styles.layerMap_water}`} aria-label="Esquema de visores WaterFlow">
      <div className={styles.layerMapTopline}>
        <span>VISOR DE CAPA</span>
        <strong>Ríos terrestres y atmosféricos</strong>
      </div>
      <div className={styles.waterControls} aria-label="Controles de capas WaterFlow">
        <label className={styles.waterCheck}>
          <input type="checkbox" checked={showRivers} onChange={(event) => setShowRivers(event.target.checked)} />
          <span>Ríos terrestres</span>
        </label>
        <label className={styles.waterCheck}>
          <input type="checkbox" checked={showWaterBodies} onChange={(event) => setShowWaterBodies(event.target.checked)} />
          <span>Cuencas y cuerpos de agua</span>
        </label>
        <button
          type="button"
          className={`${styles.atmosphericButton} ${showAtmosphericRivers ? styles.atmosphericButtonActive : ""}`}
          aria-pressed={showAtmosphericRivers}
          onClick={() => setShowAtmosphericRivers((visible) => !visible)}
        >
          <span aria-hidden="true">〰</span>
          {showAtmosphericRivers ? "Ocultar ríos atmosféricos" : "Ríos atmosféricos"}
        </button>
      </div>
      <div className={styles.layerMapCanvas}>
        <svg viewBox="0 0 760 390" role="img" aria-label="Esquema conceptual de capas de agua; sin geometrías reales">
          <defs>
            <linearGradient id="waterFlowTerrain" x1="0" x2="1" y1="0" y2="1">
              <stop stopColor="#183329" /><stop offset="1" stopColor="#07100b" />
            </linearGradient>
            <linearGradient id="waterFlowRiver" x1="0" x2="1">
              <stop stopColor="#a8eaff" /><stop offset="1" stopColor="#38bdf8" />
            </linearGradient>
            <pattern id="waterFlowGrid" width="38" height="38" patternUnits="userSpaceOnUse">
              <path d="M38 0H0V38" fill="none" stroke="rgba(226,245,226,.14)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="760" height="390" fill="url(#waterFlowTerrain)" />
          <rect width="760" height="390" fill="url(#waterFlowGrid)" opacity=".55" />
          <path d="M0 110C126 35 235 112 336 69S612 122 760 52" fill="none" stroke="rgba(157,211,151,.17)" strokeWidth="30" />
          <path d="M0 265C145 190 292 306 436 230S665 244 760 185L760 390H0Z" fill="rgba(13,42,29,.64)" />
          {showWaterBodies ? <g fill="rgba(56,189,248,.16)" stroke="rgba(128,215,255,.55)" strokeWidth="2">
            <path d="M113 108c17-20 53-19 68-1s-2 34-27 38-56-15-41-37Z" />
            <path d="M524 266c20-23 55-14 66 5s-14 32-39 29-44-16-27-34Z" />
          </g> : null}
          {showRivers ? <g fill="none" stroke="url(#waterFlowRiver)" strokeLinecap="round" strokeLinejoin="round">
            <path d="M28 279C96 262 119 219 174 231s77 56 127 20 84-65 138-43" strokeWidth="9" />
            <path d="M174 231c17-36 9-65 34-93m92 114c26 40 53 49 75 93m8-122c14-40 35-57 65-72" strokeWidth="4" opacity=".8" />
          </g> : null}
          {showAtmosphericRivers ? <g fill="none" stroke="#b9eaff" strokeWidth="4" strokeDasharray="10 11" strokeLinecap="round">
            <path d="M73 102c87-46 156-17 236-2s126 16 203-20" />
            <path d="M110 145c79-43 157-13 232 4s118 10 190-26" opacity=".78" />
            <path d="m493 75 18 4-10 14m-12 27 18 4-10 14" stroke="#e2f7ff" strokeDasharray="none" strokeWidth="2" />
          </g> : null}
          <text x="42" y="344" fill="#d9f4ff" fontSize="13" letterSpacing="2">VISTA ESQUEMÁTICA · SIN GEOMETRÍAS REALES</text>
          <path d="M22 22h74M22 22v38M738 368h-74M738 368v-38" fill="none" stroke="rgba(242,250,240,.65)" strokeWidth="2" />
        </svg>
        <span className={styles.layerMapPlace}>LECTURA HÍDRICA · CONCEPTUAL</span>
        <span className={styles.layerMapScale}>FUENTES REALES<br />POR DEFINIR</span>
      </div>
      <div className={styles.layerMapLegend}>
        <span><i /> WaterFlow · esquema interactivo</span>
        <span>Sin datos ni alertas en tiempo real</span>
      </div>
    </section>
  );
}

function LayerEssentialMap({ layer }: { layer: NatureLayer }) {
  if (layer.id === "water") return <WaterFlowMap />;

  const labels: Record<NatureLayerId, { label: string; source: string; place: string; note: string }> = {
    fire: { label: "Focos térmicos", source: "GOES · VIIRS · MODIS", place: "SANTIAGO DE CALI · AOI", note: "SEÑAL ORIENTATIVA · VERIFICACIÓN HUMANA" },
    deforestation: { label: "Parques nacionales bajo preservación", source: "Geometrías oficiales · por integrar", place: "ÁREAS PROTEGIDAS · ESQUEMA", note: "CONTORNOS ILUSTRATIVOS · NO GEOGRÁFICOS" },
    water: { label: "Ríos terrestres y atmosféricos", source: "WaterFlow · en exploración", place: "LECTURA HÍDRICA · CONCEPTUAL", note: "SIN DATOS NI ALERTAS EN TIEMPO REAL" },
  };
  const map = labels[layer.id];

  return (
    <section
      className={`${styles.layerMap} ${styles[`layerMap_${layer.id}`]}`}
      aria-label={`Visor de ${layer.title}`}
    >
      <div className={styles.layerMapTopline}>
        <span>VISOR DE CAPA</span>
        <strong>{map.label}</strong>
      </div>
      <div className={styles.layerMapCanvas}>
        <svg viewBox="0 0 760 390" role="img" aria-label={`Esquema visual conceptual: ${map.label}`}>
          <defs>
            <linearGradient id="layerTerrain" x1="0" x2="1" y1="0" y2="1">
              <stop stopColor="#183329" />
              <stop offset="1" stopColor="#07100b" />
            </linearGradient>
            <linearGradient id="layerVegetation" x1="0" x2="1" y1="0" y2="1">
              <stop stopColor="#d7ff5f" stopOpacity=".78" />
              <stop offset="1" stopColor="#2f8f5b" stopOpacity=".22" />
            </linearGradient>
            <radialGradient id="layerHeat">
              <stop stopColor="#fff0a6" />
              <stop offset=".3" stopColor="#ff9f43" stopOpacity=".94" />
              <stop offset="1" stopColor="#ff3b2f" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="layerWater" x1="0" x2="1">
              <stop stopColor="#80d7ff" stopOpacity=".95" />
              <stop offset="1" stopColor="#2187b9" stopOpacity=".2" />
            </linearGradient>
            <pattern id="layerGrid" width="38" height="38" patternUnits="userSpaceOnUse">
              <path d="M 38 0 L 0 0 0 38" fill="none" stroke="rgba(226,245,226,.14)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="760" height="390" fill="url(#layerTerrain)" />
          <rect width="760" height="390" fill="url(#layerGrid)" opacity=".55" />
          <path d="M0 110 C126 35 235 112 336 69 C484 6 612 122 760 52" fill="none" stroke="rgba(157,211,151,.17)" strokeWidth="30" />
          <path d="M0 265 C145 190 292 306 436 230 C572 160 665 244 760 185 L760 390 L0 390Z" fill="rgba(13,42,29,.64)" />

          {layer.id === "fire" ? (
            <>
              <circle cx="255" cy="178" r="72" fill="url(#layerHeat)" /><circle cx="458" cy="118" r="54" fill="url(#layerHeat)" /><circle cx="570" cy="262" r="84" fill="url(#layerHeat)" />
              {[[255, 178], [458, 118], [570, 262]].map(([x, y]) => <g key={`${x}-${y}`}><circle cx={x} cy={y} r="9" fill="#fff4b8" /><path d={`M${x - 18} ${y}h36M${x} ${y - 18}v36`} stroke="#ff5a36" strokeWidth="2" /></g>)}
            </>
          ) : null}
          {layer.id === "deforestation" ? (
            <>
              <path d="M66 91C139 42 231 48 289 97c30 25 37 67 7 90-40 30-108 12-153 35-44 24-85-22-96-69-9-27-3-48 19-62Z" fill="url(#layerVegetation)" fillOpacity=".46" stroke="#d9ff9d" strokeWidth="3" />
              <path d="M445 71c67-31 177-5 247 45 42 31 18 90-22 104-60 21-98-10-144 14-48 25-109-13-124-63-13-44 3-82 43-100Z" fill="url(#layerVegetation)" fillOpacity=".34" stroke="#d9ff9d" strokeWidth="3" />
              <path d="M65 156c58-35 108 11 158-16s69-27 98 0m76 35c56-40 105 1 152-24s89-30 152 13" fill="none" stroke="#d9ff9d" strokeOpacity=".78" strokeWidth="2" />
              <path d="M48 77 78 54l37 7 18-21 41 9 28-17 27 12 32-4 25 27-6 35-24 21-5 35-33 24-42-4-18 23-38-12-21-30-32-4-19-29 5-27-18-22Z" fill="none" stroke="#f0ffc1" strokeOpacity=".8" strokeWidth="1.5" strokeDasharray="4 5" />
              <path d="m410 69 26-26 35 7 23-22 43 7 20-13 31 17 28-2 29 27-9 28 23 24-12 36-34 18-9 31-41 11-25-15-31 11-30-17-36 4-19-26-31-9-15-33 14-24-8-33Z" fill="none" stroke="#f0ffc1" strokeOpacity=".8" strokeWidth="1.5" strokeDasharray="4 5" />
              <text x="82" y="306" fill="#efffc4" fontSize="13" letterSpacing="1.5">PARQUES NACIONALES · PRESERVACIÓN</text>
              <text x="441" y="282" fill="#d6e9bc" fontSize="11" letterSpacing="1">LÍMITES OFICIALES POR INTEGRAR</text>
            </>
          ) : null}
          <path d="M22 22h74M22 22v38M738 368h-74M738 368v-38" fill="none" stroke="rgba(242,250,240,.65)" strokeWidth="2" />
        </svg>
        <span className={styles.layerMapPlace}>{map.place}</span>
        <span className={styles.layerMapScale}>{map.note}</span>
      </div>
      <div className={styles.layerMapLegend}>
        <span><i /> {map.source}</span>
        <span>La interpretación requiere revisión humana</span>
      </div>
    </section>
  );
}

export function NatureIntelligenceHub() {
  const router = useRouter();
  const pathname = usePathname();
  const openId = layerFromPath(pathname);
  const titleId = useId();
  const openLayer = natureLayers.find((l) => l.id === openId) ?? null;

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push("/nature-intelligence", { scroll: false });
    };
    document.addEventListener("keydown", onKey);
    const prevBodyOverflow = document.body.style.overflow;
    const prevRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevRootOverflow;
    };
  }, [openId, router]);

  return (
    <div className={styles.hub} data-nature-intelligence>
      <section className={styles.hero}>
        <div className={styles.heroOrbit} aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Nature Intelligence · Observación territorial</p>
            <h1>información satelital para<br /><em>la preservación de la naturaleza</em></h1>
            <p className={styles.lede}>
              Observaciones satelitales convertidas en contexto verificable para la toma de decisiones para priorizar en el territorio.
            </p>
            <div className={styles.heroMeta} role="group" aria-label="Abrir una capa de interpretación">
              {natureLayers.map((layer) => (
                <button
                  key={layer.id}
                  type="button"
                  className={styles.heroLayerButton}
                  style={{ ["--layer-accent" as string]: layer.accent }}
                  onClick={() => router.push(layerHref(layer.id), { scroll: false })}
                  aria-haspopup="dialog"
                >
                  {layer.title}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.heroVisual} aria-label="Mapa satelital global interactivo para la toma de decisiones">
            <div className={styles.visualTopline}><b>VISIÓN TERRITORIAL PARA LA TOMA DE DECISIONES</b></div>
            <div className={styles.visualMap}>
              <WorldSatelliteMap />
            </div>
            <div className={styles.visualLegend}>
              <span>Observación → contexto → decisión</span>
            </div>
            <div className={styles.visualFooter}><span>NASA · GOES · VIIRS · MODIS · COPERNICUS</span></div>
          </div>
        </div>
      </section>

      <section className={styles.stack} aria-label="Capas Nature Intelligence">
        <div className={styles.stackIntro}>
          <p className={styles.eyebrow}>Tres capas de interpretación</p>
          <p className={styles.stackIntroCopy}>
            Explora las señales de riesgo térmico, los parques definidos para la preservación y los flujos de acuíferos.
          </p>
        </div>

        <div className={styles.strips}>
          {natureLayers.map((layer) => (
            <Link
              key={layer.id}
              className={styles.strip}
              href={layerHref(layer.id)}
              style={{ ["--accent" as string]: layer.accent }}
              aria-haspopup="dialog"
            >
              <span className={styles.stripIndex}>{layer.index}</span>
              <span className={styles.stripBody}>
                <span className={styles.stripTop}>
                  <strong>{layer.title}</strong>
                </span>
                <span className={styles.stripSub}>{layer.subtitle}</span>
                <span className={styles.stripSummary}>{layer.summary}</span>
                <span className={styles.stripSensors}>
                  {layer.sensors.map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </span>
              </span>
              <span className={styles.stripMeta}>
                <span className={styles.stripLatency}>{layer.latency}</span>
                <span className={styles.stripCta}>Ver capa <b aria-hidden="true">↗</b></span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.principles}>
        <div>
          <p className={styles.eyebrow}>Información para la toma de decisiones</p>
          <h2>La señal orienta. El territorio se verifica.</h2>
        </div>
        <ul>
          <li>
            <strong>Fire Risk alert.</strong> Los focos térmicos ayudan a priorizar zonas; no
            confirman por sí solos un incendio.
          </li>
          <li>
            <strong>Deforestation Lines.</strong> El esquema se enfocará en parques nacionales
            definidos para preservación; sus límites oficiales están pendientes de integración.
          </li>
          <li>
            <strong>WaterFlow.</strong> Diferencia cursos de agua terrestres y corredores de humedad
            atmosférica; está en exploración, sin alertas activas.
          </li>
          <li>
            <strong>Validación humana.</strong> La información ayuda a decidir qué verificar; las
            personas mantienen la decisión final.
          </li>
        </ul>
      </section>

      {openLayer ? (
        <div
          className={styles.modalRoot}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Cerrar visor"
            onClick={() => router.push("/nature-intelligence", { scroll: false })}
          />
          <div className={styles.modal} style={{ ["--accent" as string]: openLayer.accent }}>
            <header className={styles.modalHeader}>
              <div>
          <p className={styles.eyebrow}>
                  Capa {openLayer.index} · {openLayer.id === "fire" ? "FIRE RISK ALERT" : openLayer.id === "deforestation" ? "PRESERVACIÓN · ESQUEMA DE CAPA" : statusLabel(openLayer.status)}
                </p>
                <h2 id={titleId} className={openLayer.id === "fire" ? styles.fireModalTitle : undefined}>
                  {openLayer.id === "fire" ? "SEÑALES TÉRMICAS | FOCOS DE CALOR" : openLayer.title}
                </h2>
              </div>
              <button type="button" className={styles.close} aria-label="Cerrar visor" onClick={() => router.push("/nature-intelligence", { scroll: false })}>×</button>
            </header>
            <div className={styles.modalStage}>
              {openLayer.id === "fire" ? (
                <div className={styles.liveMapStage}>
                  <FireMapViewer active />
                </div>
              ) : (
                <LayerEssentialMap layer={openLayer} />
              )}
            </div>
            <div className={styles.modalDetails}>
              <p className={styles.modalSummary}>{openLayer.summary}</p>
              <ul className={styles.modalBullets}>
                {openLayer.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
