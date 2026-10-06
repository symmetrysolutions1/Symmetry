"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { commercialPorts, maritimeSources } from "@/lib/eudr-maritime";
import { EudrCopernicusMap } from "./eudr-copernicus-map";
import styles from "./eudr-maritime-console.module.css";

type FeatureCard = {
  id: "routes" | "market" | "products";
  index: string;
  eyebrow: string;
  title: string;
  summary: string;
};

const featureCards: FeatureCard[] = [
  {
    id: "routes",
    index: "01",
    eyebrow: "RANKING CEPAL · 2024",
    title: "Rutas marítimas mercantiles",
    summary: "Los 15 puertos de contenedores con más movimiento en América Latina y el Caribe, también señalados en el mapa.",
  },
  {
    id: "market",
    index: "02",
    eyebrow: "EUROSTAT · COMERCIO REAL",
    title: "Potencial del mercado EUDR",
    summary: "Mira qué importa la Unión Europea y de dónde viene el café, con cifras de fuentes oficiales.",
  },
  {
    id: "products",
    index: "03",
    eyebrow: "ANEXO I · EUDR",
    title: "Productos que cubre el EUDR",
    summary: "Conoce las siete materias primas reguladas y algunos productos que aparecen en el Anexo I.",
  },
];

const marketImportGroups = [
  { label: "Café, té, mate y especias", value: 17 },
  { label: "Cacao y preparaciones", value: 16 },
  { label: "Oleaginosas y semillas", value: 15 },
];

const coffeeOrigins = [
  { label: "Brasil", value: 34 },
  { label: "Vietnam", value: 20 },
  { label: "Uganda", value: 9 },
  { label: "Colombia", value: 6 },
  { label: "Honduras", value: 5 },
  { label: "Otros orígenes", value: 26, derived: true },
];

const regulatedCommodities = [
  { name: "Ganado bovino", products: "Animales bovinos vivos y determinados productos de carne bovina del Anexo I." },
  { name: "Cacao", products: "Granos, cáscaras y residuos; pasta, manteca, polvo y chocolate incluidos en los códigos del Anexo I." },
  { name: "Café", products: "Café verde, tostado o descafeinado y productos enumerados por código en el Anexo I." },
  { name: "Palma aceitera", products: "Nueces y almendras de palma, aceite de palma y determinados derivados expresamente listados." },
  { name: "Caucho", products: "Caucho natural y determinados productos derivados especificados en el Anexo I." },
  { name: "Soja", products: "Habas de soja, aceite, harina y tortas/residuos incluidos en el Anexo I." },
  { name: "Madera", products: "Leña y madera, carbón vegetal, madera aserrada, tableros, pasta, papel y ciertos artículos de madera listados." },
];

const portNumber = new Intl.NumberFormat("es-CO");
const marketSources = {
  trade: "https://agriculture.ec.europa.eu/media/news/eu-agri-food-trade-hits-new-records-2025-2026-03-13_en",
  coffee: "https://ec.europa.eu/eurostat/en/web/products-eurostat-news/w/ddn-20261001-1",
  categories: "https://ec.europa.eu/eurostat/documents/15216629/22711561/KS-01-25-049-EN-N.pdf/86247e8d-0fb6-1fff-f14a-6c25114cb138?download=true",
};

export function EudrMaritimeConsole() {
  const [activeFeature, setActiveFeature] = useState<FeatureCard | null>(null);
  const [marketTab, setMarketTab] = useState<"categories" | "origins">("categories");

  useEffect(() => {
    if (!activeFeature) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveFeature(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeFeature]);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.kicker}><span /> EUDR · DEL ORIGEN AL PUERTO</div>
          <h1>
            <span>Infraestructura</span>
            <span>de trazabilidad</span>
            <span>para productos</span>
            <span>libres de</span>
            <span>deforestación.</span>
          </h1>
          <p className={styles.lede}>
            Seguimos cada lote desde la parcela y sus proveedores hasta el puerto de salida y el de llegada. Así, el recorrido también deja un rastro que se puede revisar.
          </p>
        </div>
        <div className={styles.heroViewer}>
          <EudrCopernicusMap />
          <div className={styles.viewerCaption}>
            <span className={styles.modeBadge}>CENTROS REGIONALES COPERNICUS</span>
            <span>Acceso y mirrors Copernicus.</span>
          </div>
        </div>
      </section>

      <section className={styles.routeSection} id="corredores">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.sectionLabel}>El viaje también cuenta</span>
            <h2>Del puerto al mercado: ¿qué podemos averiguar?</h2>
          </div>
          <p>Explora los puertos, mira qué oportunidad ofrece Europa y descubre qué productos cubre el reglamento, con las fuentes a la vista.</p>
        </div>
        <div className={styles.routeGrid}>
          {featureCards.map((feature) => (
            <button className={`${styles.routeCard} ${styles[`routeCard${feature.id[0].toUpperCase()}${feature.id.slice(1)}`]}`} key={feature.id} type="button" onClick={() => { setActiveFeature(feature); setMarketTab("categories"); }}>
              <div className={styles.routeCardTop}><span>{feature.index} · {feature.eyebrow}</span><span>ABRIR</span></div>
              <h3>{feature.title}</h3>
              <p>{feature.summary}</p>
              <small>Ver información completa <ArrowRight /></small>
            </button>
          ))}
        </div>
      </section>

      {activeFeature ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveFeature(null); }}>
          <div className={`${styles.modalPanel} ${styles[`modalPanel${activeFeature.id[0].toUpperCase()}${activeFeature.id.slice(1)}`]}`} role="dialog" aria-modal="true" aria-labelledby={`${activeFeature.id}-title`}>
            <div className={styles.modalTopline}><span>{activeFeature.index} · {activeFeature.eyebrow}</span><button className={styles.modalClose} type="button" onClick={() => setActiveFeature(null)} aria-label="Cerrar información">×</button></div>
            <h2 id={`${activeFeature.id}-title`}>{activeFeature.title}</h2>
            <p className={styles.modalSummary}>{activeFeature.summary}</p>
            {activeFeature.id === "routes" ? (
              <div className={styles.portReport}>
                <p className={styles.reportMeta}>Los puertos con más movimiento · 2024 · contenedores TEU</p>
                <ol className={styles.portList}>
                  {commercialPorts.map((port) => (
                    <li className={styles.portRow} key={port.id}>
                      <span className={styles.portRank}>{String(port.rank).padStart(2, "0")}</span>
                      <span className={styles.portName}><strong>{port.name}</strong><small>{port.country}</small></span>
                      <span className={styles.portVolume}>{portNumber.format(port.throughputTeu)}<small>TEU</small></span>
                    </li>
                  ))}
                </ol>
                <a className={styles.reportSource} href="https://repositorio.cepal.org/server/api/core/bitstreams/78bf876d-9187-403a-a3d6-58adaba60f15/content" target="_blank" rel="noreferrer">Fuente: CEPAL, Boletín FAL 114 <ArrowRight /></a>
              </div>
            ) : null}

            {activeFeature.id === "market" ? (
              <div className={styles.marketReport}>
                <div className={styles.marketKpis}>
                  <div><strong>€188,6 mil M</strong><span>importaciones agroalimentarias UE · 2025</span></div>
                  <div><strong>€18,2 mil M</strong><span>importaciones desde Brasil · 2025</span></div>
                  <div><strong>2,9 Mt</strong><span>café importado por la UE · 2025</span></div>
                </div>
                <div className={styles.chartTabs} role="tablist" aria-label="Vistas del reporte de mercado">
                  <button className={marketTab === "categories" ? styles.chartTabActive : ""} type="button" role="tab" aria-selected={marketTab === "categories"} onClick={() => setMarketTab("categories")}>Qué importa la UE · 2024</button>
                  <button className={marketTab === "origins" ? styles.chartTabActive : ""} type="button" role="tab" aria-selected={marketTab === "origins"} onClick={() => setMarketTab("origins")}>De dónde viene el café · 2025</button>
                </div>
                {marketTab === "categories" ? (
                  <div className={styles.chartPanel} role="tabpanel">
                    <h3>Grupos agroalimentarios con mayor valor importado</h3>
                    <p>Valor aproximado de importación en 2024, miles de millones de euros.</p>
                    {marketImportGroups.map((item) => (
                      <div className={styles.barRow} key={item.label}><span>{item.label}</span><div className={styles.barTrack}><i style={{ width: `${(item.value / 17) * 100}%` }} /></div><strong>€{item.value} mil M</strong></div>
                    ))}
                    <small>Las categorías publicadas son grupos amplios y no equivalen exclusivamente a códigos EUDR.</small>
                  </div>
                ) : (
                  <div className={styles.chartPanel} role="tabpanel">
                    <h3>¿De dónde viene el café que compra la UE?</h3>
                    <p>Porcentaje del volumen importado en 2025. “Otros” corresponde a la parte restante, calculada.</p>
                    {coffeeOrigins.map((item) => (
                      <div className={styles.barRow} key={item.label}><span>{item.label}{item.derived ? " · calculado" : ""}</span><div className={styles.barTrack}><i style={{ width: `${(item.value / 34) * 100}%` }} /></div><strong>{item.value}%</strong></div>
                    ))}
                  </div>
                )}
                <div className={styles.reportSources}><a href={marketSources.trade} target="_blank" rel="noreferrer">Comisión Europea · comercio agroalimentario 2025 <ArrowRight /></a><a href={marketSources.coffee} target="_blank" rel="noreferrer">Eurostat · importaciones de café 2025 <ArrowRight /></a><a href={marketSources.categories} target="_blank" rel="noreferrer">Eurostat · estadísticas de comercio <ArrowRight /></a></div>
              </div>
            ) : null}

            {activeFeature.id === "products" ? (
              <div className={styles.productsReport}>
                <p className={styles.reportMeta}>Siete materias primas; los productos concretos aparecen en el Anexo I.</p>
                <ul className={styles.commodityList}>
                  {regulatedCommodities.map((item) => <li className={styles.commodityRow} key={item.name}><strong>{item.name}</strong><span>{item.products}</span></li>)}
                </ul>
                <p className={styles.scopeUpdate}>Que un producto aparezca aquí no significa que ya cumpla el EUDR: la inclusión depende de su código exacto. La Comisión adoptó una actualización del alcance el 13 de julio de 2026, todavía sujeta a revisión legislativa; las nuevas inclusiones aplicarían desde el 30 de diciembre de 2027.</p>
                <a className={styles.reportSource} href="https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32023R1115" target="_blank" rel="noreferrer">Fuente: Reglamento (UE) 2023/1115 · Anexo I <ArrowRight /></a>
                <a className={styles.reportSource} href="https://environment.ec.europa.eu/news/commission-updates-product-scope-and-tools-support-eudr-2026-07-13_en" target="_blank" rel="noreferrer">Comisión Europea · actualización de alcance 2026 <ArrowRight /></a>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <section className={styles.sourcesSection} id="fuentes">
        <div className={styles.sourcesIntro}>
          <span className={styles.sectionLabel}>Para seguir la pista de los datos</span>
          <h2>Fuentes que puedes consultar.</h2>
          <p>Los centros y mirrors del mapa muestran opciones regionales para acceder a Copernicus; no son estaciones en vivo. Las rutas son referencias históricas o estimadas: antes de usarlas en un caso concreto, hay que revisar su fuente, fecha y licencia.</p>
          <a className={styles.textLink} href="https://sentinels.copernicus.eu/web/sentinel/missions/international-cooperation/partners" target="_blank" rel="noreferrer">Ver cooperación internacional Copernicus <ArrowRight /></a>
          <br />
          <Link className={styles.textLink} href="/contact">Diseñar una integración controlada <ArrowRight /></Link>
        </div>
        <div className={styles.sourceList}>
          {maritimeSources.map((source) => (
            <a className={styles.sourceRow} href={source.href} target="_blank" rel="noreferrer" key={source.name}>
              <span className={styles.sourceMode}>{source.mode}</span>
              <span><strong>{source.name}</strong><small>{source.role}</small></span>
              <ArrowRight />
            </a>
          ))}
        </div>
      </section>

      <section className={styles.disclaimer}>
        <div><span className={styles.sectionLabel}>Una aclaración importante</span><h2>Una ruta no cuenta toda la historia.</h2></div>
        <p>Ver por dónde viaja un lote aporta contexto, pero no demuestra de dónde viene ni si cumple el EUDR. Para completar esa lectura hacen falta la parcela, el proveedor, los documentos y la evidencia territorial.</p>
      </section>
    </main>
  );
}
