"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { natureLayers, type NatureLayer, type NatureLayerId } from "@/lib/nature-layers";
import { FireMapViewer } from "@/components/nature-viewers/fire-map";
import styles from "./nature-intelligence-hub.module.css";

function statusLabel(status: "live" | "pilot" | "roadmap") {
  if (status === "live") return "DISPONIBLE";
  if (status === "pilot") return "PILOTO";
  return "EN EXPLORACIÓN";
}

function LayerEssentialMap({ layer }: { layer: NatureLayer }) {
  const labels: Record<NatureLayerId, { label: string; source: string }> = {
    fire: { label: "Focos térmicos", source: "GOES · VIIRS · MODIS" },
    deforestation: { label: "Cobertura vegetal", source: "Sentinel-2 · NDVI" },
    territory: { label: "Área de interés", source: "Geometría · responsables" },
    alerts: { label: "Señales por revisar", source: "Priorización · operador" },
    evidence: { label: "Ruta de evidencia", source: "Fuente · revisión · ancla" },
    water: { label: "Lectura hídrica", source: "Sentinel-2 SWIR · exploración" },
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
        <svg viewBox="0 0 760 390" role="img" aria-label={`${map.label} sobre territorio de referencia`}>
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
              <path d="M76 88 C170 38 280 68 331 130 C271 188 175 205 82 160Z" fill="url(#layerVegetation)" /><path d="M384 163 C470 94 651 105 710 194 C626 264 481 262 407 222Z" fill="url(#layerVegetation)" />
              <path d="M180 271 C250 232 355 252 400 315 C315 355 218 348 154 314Z" fill="rgba(215,255,95,.18)" stroke="#d7ff5f" strokeDasharray="6 7" />
              <path d="M475 71 L619 238" stroke="#ff9f43" strokeWidth="3" strokeDasharray="7 9" /><text x="492" y="93" fill="#ffd0a8" fontSize="15">cambio a revisar</text>
            </>
          ) : null}
          {layer.id === "territory" ? (
            <>
              <path d="M176 101 L532 78 L650 221 L471 325 L157 264Z" fill="rgba(125,211,160,.16)" stroke="#a5f0bb" strokeWidth="3" strokeDasharray="9 7" />
              {[[176, 101], [532, 78], [650, 221], [471, 325], [157, 264]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="7" fill="#a5f0bb" />)}
              <circle cx="405" cy="200" r="10" fill="#ff9f43" /><path d="M405 150v-20M405 250v20M355 200h-20M455 200h20" stroke="#a5f0bb" strokeWidth="2" />
            </>
          ) : null}
          {layer.id === "alerts" ? (
            <>
              <path d="M145 252 L247 171 L367 224 L486 112 L626 178" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="2" strokeDasharray="5 8" />
              {[[247, 171, "#ff9f43"], [367, 224, "#ff3b2f"], [486, 112, "#ff3b2f"], [626, 178, "#80d7ff"]].map(([x, y, color]) => <g key={`${x}-${y}`}><circle cx={x} cy={y} r="22" fill={String(color)} opacity=".13" /><circle cx={x} cy={y} r="8" fill={String(color)} /><circle cx={x} cy={y} r="14" fill="none" stroke={String(color)} strokeWidth="1" /></g>)}
              <text x="156" y="289" fill="#f6fbf5" fontSize="15">cola de validación territorial</text>
            </>
          ) : null}
          {layer.id === "evidence" ? (
            <>
              <path d="M135 242 C228 80 319 313 421 145 S597 106 651 218" fill="none" stroke="#a8d8ff" strokeWidth="3" strokeDasharray="5 8" />
              {[[135, 242, "01"], [286, 165, "02"], [421, 145, "03"], [548, 156, "04"], [651, 218, "05"]].map(([x, y, label]) => <g key={String(label)}><circle cx={x} cy={y} r="19" fill="#0b1820" stroke="#a8d8ff" strokeWidth="2" /><text x={x} y={Number(y) + 5} fill="#d8eeff" fontSize="13" textAnchor="middle">{label}</text></g>)}
              <text x="135" y="286" fill="#d8eeff" fontSize="15">fuente → validación → manifiesto → ancla</text>
            </>
          ) : null}
          {layer.id === "water" ? (
            <>
              <path d="M-25 84 C140 26 196 142 340 94 S532 57 785 151" fill="none" stroke="url(#layerWater)" strokeWidth="18" opacity=".9" />
              <path d="M98 334 C200 236 288 339 402 270 S581 229 714 342" fill="none" stroke="url(#layerWater)" strokeWidth="12" opacity=".72" />
              <ellipse cx="511" cy="196" rx="76" ry="38" fill="#66c9ed" fillOpacity=".24" stroke="#80d7ff" strokeWidth="2" />
              <path d="M456 196h110" stroke="#d9f4ff" strokeDasharray="5 7" /><text x="450" y="250" fill="#c7edff" fontSize="15">cambio hídrico por explorar</text>
            </>
          ) : null}
          <path d="M22 22h74M22 22v38M738 368h-74M738 368v-38" fill="none" stroke="rgba(242,250,240,.65)" strokeWidth="2" />
        </svg>
        <span className={styles.layerMapPlace}>TERRITORIO DE REFERENCIA</span>
        <span className={styles.layerMapScale}>LECTURA INICIAL<br />CON CONTEXTO</span>
      </div>
      <div className={styles.layerMapLegend}>
        <span><i /> {map.source}</span>
        <span>La interpretación requiere revisión humana</span>
      </div>
    </section>
  );
}

export function NatureIntelligenceHub() {
  const [openId, setOpenId] = useState<NatureLayerId | null>(null);
  const titleId = useId();
  const openLayer = natureLayers.find((l) => l.id === openId) ?? null;

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
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
  }, [openId]);

  return (
    <div className={styles.hub} data-nature-intelligence>
      <section className={styles.hero}>
        <div className={styles.heroOrbit} aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Nature Intelligence · Observación territorial</p>
            <h1>El territorio cambia.<br /><em>Que no te tome por sorpresa.</em></h1>
            <p className={styles.lede}>
              Mira señales satelitales, entiende dónde importan y conserva cómo respondió tu
              equipo. De la primera observación a la evidencia que puede revisarse.
            </p>
            <div className={styles.heroMeta}>
              <span>Focos térmicos en vivo</span>
              <span>Copernicus en piloto</span>
              <span>Validación humana</span>
            </div>
            <div className={styles.heroActions}>
              <button type="button" className={styles.primaryBtn} onClick={() => setOpenId("fire")}>
                Explorar señales térmicas <span aria-hidden="true">↗</span>
              </button>
              <Link href="/nature-intelligence/console" className={styles.ghostBtn}>
                Ver consola operativa <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          <div className={styles.heroVisual} aria-label="Visualización conceptual de capas satelitales sobre Cali">
            <div className={styles.visualTopline}><span>VISOR TERRITORIAL</span><b><i /> SEÑALES EN OBSERVACIÓN</b></div>
            <div className={styles.visualMap}>
              <div className={styles.mapGrid} />
              <div className={`${styles.contour} ${styles.contourOne}`} />
              <div className={`${styles.contour} ${styles.contourTwo}`} />
              <div className={`${styles.contour} ${styles.contourThree}`} />
              <div className={`${styles.scanLine}`} />
              <span className={`${styles.mapPin} ${styles.pinOne}`}><i /></span>
              <span className={`${styles.mapPin} ${styles.pinTwo}`}><i /></span>
              <span className={`${styles.mapPin} ${styles.pinThree}`}><i /></span>
              <span className={styles.mapPlace}>CALI · COLOMBIA</span>
              <span className={styles.mapScale}>3.45° N<br />76.53° O</span>
            </div>
            <div className={styles.visualLegend}>
              <span><i className={styles.legendFire} /> Térmico</span>
              <span><i className={styles.legendVegetation} /> Vegetación</span>
              <span><i className={styles.legendTerritory} /> Territorio</span>
            </div>
            <div className={styles.visualFooter}><span>GOES · VIIRS · MODIS</span><span>Fuente satelital → validación → evidencia</span></div>
          </div>
        </div>
      </section>

      <section className={styles.stack} aria-label="Capas Nature Intelligence">
        <div className={styles.stackIntro}>
          <div>
            <p className={styles.eyebrow}>Un territorio. Distintas señales.</p>
            <h2>Elige qué quieres observar.</h2>
          </div>
          <p className={styles.stackIntroCopy}>
            Abre cada capa para ver su fuente, alcance actual y cómo se convierte en contexto
            operativo. La disponibilidad cambia según el tipo de observación.
          </p>
        </div>

        <div className={styles.strips}>
          {natureLayers.map((layer) => (
            <button
              key={layer.id}
              type="button"
              className={styles.strip}
              style={{ ["--accent" as string]: layer.accent }}
              onClick={() => setOpenId(layer.id)}
              aria-haspopup="dialog"
            >
              <span className={styles.stripIndex}>{layer.index}</span>
              <span className={styles.stripBody}>
                <span className={styles.stripTop}>
                  <strong>{layer.title}</strong>
                  <em className={styles[`status_${layer.status}`]}>{statusLabel(layer.status)}</em>
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
            </button>
          ))}
        </div>
      </section>

      <section className={styles.principles}>
        <div>
          <p className={styles.eyebrow}>De la señal a la acción responsable</p>
          <h2>La tecnología alerta. Las personas deciden.</h2>
        </div>
        <ul>
          <li>
            <strong>Más de una mirada.</strong> Las fuentes térmicas detectan señales; la óptica
            aporta contexto cuando está disponible.
          </li>
          <li>
            <strong>Territorio con límites.</strong> Cada análisis se vincula al área registrada
            para ese monitoreo.
          </li>
          <li>
            <strong>Validación humana.</strong> Una alerta orienta la revisión; no confirma por sí
            sola un evento ni activa una respuesta.
          </li>
          <li>
            <strong>Historia revisable.</strong> Fuente, observación, validación y decisión pueden
            conservarse como evidencia.
          </li>
        </ul>
      </section>

      <section className={styles.next}>
        <span>Cuando el territorio se conecta con una cadena de suministro</span>
        <Link href="/eudr">Conocer EUDR y trazabilidad →</Link>
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
            onClick={() => setOpenId(null)}
          />
          <div className={styles.modal} style={{ ["--accent" as string]: openLayer.accent }}>
            <header className={styles.modalHeader}>
              <div>
                <p className={styles.eyebrow}>
                  Capa {openLayer.index} · {openLayer.id === "fire" ? "FIRE RISK ALERT" : statusLabel(openLayer.status)}
                </p>
                <h2 id={titleId} className={openLayer.id === "fire" ? styles.fireModalTitle : undefined}>
                  {openLayer.id === "fire" ? "SEÑALES TÉRMICAS | FOCOS DE CALOR" : openLayer.title}
                </h2>
              </div>
              <button type="button" className={styles.close} aria-label="Cerrar visor" onClick={() => setOpenId(null)}>×</button>
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
