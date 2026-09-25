"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CALI_AOI } from "@/lib/nature-layers";

type Props = { active: boolean };

type HotspotResponse = {
  type: string;
  features: Array<{
    geometry: { coordinates: [number, number] };
    properties: Record<string, unknown>;
  }>;
  meta: {
    mode: string;
    counts: Record<string, number>;
    warning?: string | null;
    last_refresh?: string;
  };
};

export type MapLibrePoint = { x: number; y: number };
type MapLibreClickEvent = { point: MapLibrePoint };
type MapLibrePopupOptions = {
  closeButton?: boolean;
  closeOnClick?: boolean;
  offset?: number;
  maxWidth?: string;
  className?: string;
};
export type MapLibreMap = {
  addControl(control: unknown, position?: string): void;
  addSource(id: string, source: unknown): void;
  addLayer(layer: unknown, beforeId?: string): void;
  on(event: "click", listener: (event: MapLibreClickEvent) => void): void;
  on(event: string, listener: () => void): void;
  once(event: string, listener: () => void): void;
  project(coordinates: [number, number]): MapLibrePoint;
  getZoom(): number;
  getContainer(): HTMLElement;
  getLayer(id: string): unknown;
  getSource(id: string): { setTiles?: (tiles: string[]) => void } | undefined;
  setLayoutProperty(id: string, property: string, value: unknown): void;
  isStyleLoaded(): boolean;
  flyTo(options: { center: [number, number]; zoom: number; duration: number }): void;
  fitBounds(bounds: [[number, number], [number, number]], options: { padding: number; maxZoom: number; duration: number }): void;
  remove(): void;
};
type MapLibrePopup = {
  setLngLat(coordinates: [number, number]): MapLibrePopup;
  setDOMContent(content: HTMLElement): MapLibrePopup;
  addTo(map: MapLibreMap): MapLibrePopup;
  getElement(): HTMLElement;
};
type MapLibreMarker = {
  setLngLat(coordinates: [number, number]): MapLibreMarker;
  addTo(map: MapLibreMap): MapLibreMarker;
  remove(): void;
};
export type MapLibreNamespace = {
  Map: new (options: Record<string, unknown>) => MapLibreMap;
  NavigationControl: new (options: { showCompass: boolean }) => unknown;
  AttributionControl: new (options: { compact: boolean }) => unknown;
  Popup: new (options: MapLibrePopupOptions) => MapLibrePopup;
  Marker: new (options: { element: HTMLElement; anchor?: string }) => MapLibreMarker;
};

declare global {
  interface Window {
    maplibregl?: MapLibreNamespace;
  }
}

export function loadMapLibre(): Promise<MapLibreNamespace> {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  if (window.maplibregl) return Promise.resolve(window.maplibregl);
  return new Promise((resolve, reject) => {
    const cssId = "maplibre-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css";
      document.head.appendChild(link);
    }
    const existing = document.querySelector("script[data-maplibre]");
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.maplibregl) resolve(window.maplibregl);
        else reject(new Error("maplibre load failed"));
      });
      existing.addEventListener("error", () => reject(new Error("maplibre load failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js";
    script.async = true;
    script.dataset.maplibre = "1";
    script.onload = () => {
      if (window.maplibregl) resolve(window.maplibregl);
      else reject(new Error("maplibre load failed"));
    };
    script.onerror = () => reject(new Error("maplibre load failed"));
    document.body.appendChild(script);
  });
}

const HOTSPOT_VISUALS = [
  {
    key: "goes",
    label: "GOES watch",
    provider: "NOAA ABI · FIRMS",
    color: "#ffad38",
    haloRadius: ["interpolate", ["linear"], ["zoom"], 8, 14, 11, 26, 15, 42],
    coreRadius: ["interpolate", ["linear"], ["zoom"], 8, 3.5, 12, 5, 16, 7],
    pulseMaxRadius: 34,
  },
  {
    key: "viirs",
    label: "VIIRS confirm",
    provider: "S-NPP / NOAA-20/21 · FIRMS",
    color: "#ff493d",
    haloRadius: ["interpolate", ["linear"], ["zoom"], 8, 9, 11, 16, 15, 26],
    coreRadius: ["interpolate", ["linear"], ["zoom"], 8, 3, 12, 4.5, 16, 6.5],
    pulseMaxRadius: 27,
  },
  {
    key: "modis",
    label: "MODIS confirm",
    provider: "Terra / Aqua · FIRMS",
    color: "#d94b68",
    haloRadius: ["interpolate", ["linear"], ["zoom"], 8, 12, 11, 21, 15, 34],
    coreRadius: ["interpolate", ["linear"], ["zoom"], 8, 3.2, 12, 4.8, 16, 6.8],
    pulseMaxRadius: 31,
  },
] as const;

function popupMetric(value: unknown, unit: string) {
  if (value === null || value === undefined || value === "") return "Sin dato";
  const number = Number(value);
  return Number.isFinite(number)
    ? `${number.toLocaleString("es-CO", { maximumFractionDigits: 2 })} ${unit}`
    : `${String(value)} ${unit}`;
}

function popupConfidence(value: unknown) {
  if (value === null || value === undefined || value === "") return "Sin dato";
  const confidence = String(value).trim().toLowerCase();
  const categories: Record<string, string> = {
    l: "Baja",
    low: "Baja",
    n: "Nominal",
    nominal: "Nominal",
    h: "Alta",
    high: "Alta",
  };
  if (confidence in categories) return categories[confidence];
  const number = Number(value);
  return Number.isFinite(number) ? `${number}%` : String(value);
}

function localDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const LST_LAYER = "MODIS_Terra_L3_Land_Surface_Temp_Daily_Day";

function lstObservationDate(selectedDate: string, latestAvailableDate?: string) {
  if (selectedDate) return selectedDate;
  if (latestAvailableDate) return latestAvailableDate;
  const latestLikelyDate = new Date();
  latestLikelyDate.setUTCDate(latestLikelyDate.getUTCDate() - 2);
  return latestLikelyDate.toISOString().slice(0, 10);
}

function lstTileUrl(date: string) {
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${LST_LAYER}/default/${date}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png`;
}

async function discoverLatestLstDate() {
  const params = new URLSearchParams({
    SERVICE: "WMTS",
    REQUEST: "DescribeDomains",
    VERSION: "1.0.0",
    LAYER: LST_LAYER,
    TILEMATRIXSET: "GoogleMapsCompatible_Level7",
  });
  const response = await fetch(`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?${params}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`NASA GIBS time domain HTTP ${response.status}`);
  const xml = await response.text();
  const today = localDateValue(new Date());
  const dates = [...xml.matchAll(/\d{4}-\d{2}-\d{2}/g)]
    .map(([date]) => date)
    .filter((date) => date <= today)
    .sort();
  return dates.length ? dates[dates.length - 1] : "";
}

function buildRiskMapData(
  features: HotspotResponse["features"],
  enabledLayers: Record<string, boolean>,
) {
  const selected = features
    .filter((feature) => enabledLayers[String(feature.properties.source ?? "")] === true)
    .filter((feature) => feature.geometry?.coordinates?.every(Number.isFinite));
  if (!selected.length) return { labels: [] as Array<{ coordinates: [number, number]; score: number }> };

  const clusterRadiusKm = 3;
  const localSignals = selected.map((feature) => {
    const coordinates = feature.geometry.coordinates;
    const nearby = selected.filter((candidate) => {
      const other = candidate.geometry.coordinates;
      const latKm = (other[1] - coordinates[1]) * 111;
      const lonKm = (other[0] - coordinates[0]) * 111 * Math.cos(coordinates[1] * Math.PI / 180);
      return Math.hypot(latKm, lonKm) <= clusterRadiusKm;
    });
    const localFrp = nearby.reduce((sum, candidate) => {
      const frp = Number(candidate.properties.frp);
      return sum + (Number.isFinite(frp) && frp > 0 ? frp : 0);
    }, 0);
    return { coordinates, localFrp };
  }).filter(({ localFrp }) => localFrp > 0).sort((a, b) => b.localFrp - a.localFrp);
  if (!localSignals.length) return { labels: [] as Array<{ coordinates: [number, number]; score: number }> };

  const maximumLogPower = Math.log1p(localSignals[0].localFrp);
  const labels: Array<{ coordinates: [number, number]; score: number }> = [];
  for (const { coordinates, localFrp } of localSignals) {
    const score = Math.round((Math.log1p(localFrp) / maximumLogPower) * 100);
    if (score < 50) continue;
    const tooClose = labels.some(({ coordinates: existing }) => {
      const latKm = (existing[1] - coordinates[1]) * 111;
      const lonKm = (existing[0] - coordinates[0]) * 111 * Math.cos(coordinates[1] * Math.PI / 180);
      return Math.hypot(latKm, lonKm) < clusterRadiusKm;
    });
    if (!tooClose) labels.push({ coordinates, score });
    if (labels.length >= 6) break;
  }
  return { labels };
}

function createDateFilterControl(onSearch: (date: string) => void, onLive: () => void) {
  const container = document.createElement("div");
  container.className = "maplibregl-ctrl ni-date-control";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "ni-date-trigger";
  trigger.setAttribute("aria-label", "Elegir fecha de detección");
  trigger.setAttribute("aria-expanded", "false");
  trigger.title = "Filtrar detecciones por fecha";
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  const frame = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  frame.setAttribute("x", "3.5"); frame.setAttribute("y", "5");
  frame.setAttribute("width", "17"); frame.setAttribute("height", "15");
  frame.setAttribute("rx", "2.5");
  const header = document.createElementNS("http://www.w3.org/2000/svg", "path");
  header.setAttribute("d", "M7.5 3.5v3M16.5 3.5v3M4 9h16");
  const day = document.createElementNS("http://www.w3.org/2000/svg", "path");
  day.setAttribute("d", "M8 12.5h.01M12 12.5h.01M16 12.5h.01M8 16h.01M12 16h.01");
  for (const shape of [frame, header, day]) {
    shape.setAttribute("fill", "none");
    shape.setAttribute("stroke", "currentColor");
    shape.setAttribute("stroke-width", "1.7");
    shape.setAttribute("stroke-linecap", "round");
    shape.setAttribute("stroke-linejoin", "round");
    icon.append(shape);
  }
  trigger.append(icon);

  const panel = document.createElement("div");
  panel.className = "ni-date-panel";
  panel.hidden = true;
  const heading = document.createElement("div");
  heading.className = "ni-date-heading";
  const title = document.createElement("span");
  title.className = "ni-date-title";
  title.textContent = "Fecha de detección";
  const live = document.createElement("button");
  live.type = "button";
  live.className = "ni-date-live";
  live.textContent = "En vivo";
  live.setAttribute("aria-label", "Volver a detecciones en vivo");
  heading.append(title, live);
  const input = document.createElement("input");
  input.type = "date";
  input.className = "ni-date-input";
  input.setAttribute("aria-label", "Fecha de detección");
  const today = new Date();
  input.max = localDateValue(today);
  input.min = "2000-01-01";

  const footer = document.createElement("div");
  footer.className = "ni-date-footer";
  const hint = document.createElement("span");
  hint.textContent = "Filtra días de la consulta";
  const search = document.createElement("button");
  search.type = "button";
  search.className = "ni-date-search";
  search.textContent = "Buscar";
  search.setAttribute("aria-label", "Buscar focos térmicos para la fecha elegida");
  footer.append(hint, search);
  panel.append(heading, input, footer);
  container.append(trigger, panel);

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    panel.hidden = !panel.hidden;
    trigger.setAttribute("aria-expanded", String(!panel.hidden));
    if (!panel.hidden) input.focus();
  });
  search.addEventListener("click", (event) => {
    event.stopPropagation();
    if (input.value) onSearch(input.value);
  });
  live.addEventListener("click", (event) => {
    event.stopPropagation();
    input.value = "";
    onLive();
  });
  container.addEventListener("mousedown", (event) => event.stopPropagation());
  container.addEventListener("click", (event) => event.stopPropagation());

  return {
    onAdd() { return container; },
    onRemove() { container.remove(); },
  };
}

function appendPopupRow(list: HTMLElement, label: string, value: string, kind = "") {
  const row = document.createElement("div");
  row.className = `ni-hotspot-popup-row ${kind}`.trim();
  const term = document.createElement("span");
  term.textContent = label;
  const detail = document.createElement("strong");
  detail.textContent = value;
  row.append(term, detail);
  list.append(row);
}

function createHotspotPopupContent(feature: HotspotResponse["features"][number], visual: (typeof HOTSPOT_VISUALS)[number]) {
  const properties = feature.properties ?? {};
  const content = document.createElement("article");
  content.className = "ni-hotspot-popup";
  content.style.setProperty("--hotspot-color", visual.color);

  const eyebrow = document.createElement("p");
  eyebrow.className = "ni-hotspot-popup-eyebrow";
  eyebrow.textContent = "SEÑAL SATELITAL · FOCO TÉRMICO";
  const title = document.createElement("h4");
  title.textContent = visual.label;
  const provider = document.createElement("p");
  provider.className = "ni-hotspot-popup-provider";
  provider.textContent = visual.provider;
  content.append(eyebrow, title, provider);

  const details = document.createElement("div");
  details.className = "ni-hotspot-popup-details";
  const acquiredDate = properties.acq_date ? String(properties.acq_date) : "";
  const rawTime = properties.acq_time === null || properties.acq_time === undefined
    ? ""
    : String(properties.acq_time).padStart(4, "0");
  const acquiredTime = rawTime ? `${rawTime.slice(0, 2)}:${rawTime.slice(2, 4)} UTC` : "";
  appendPopupRow(details, "Adquisición", [acquiredDate, acquiredTime].filter(Boolean).join(" · ") || "Sin dato", "ni-hotspot-popup-time");
  appendPopupRow(details, "Potencia", popupMetric(properties.frp, "MW"), "ni-hotspot-popup-metric");
  appendPopupRow(details, "Brillo térmico", popupMetric(properties.bright, "K"), "ni-hotspot-popup-metric");
  appendPopupRow(details, "Confianza", popupConfidence(properties.confidence), "ni-hotspot-popup-metric");
  const coordinates = feature.geometry?.coordinates;
  if (Array.isArray(coordinates) && coordinates.length >= 2) {
    appendPopupRow(details, "Coordenadas", `${Number(coordinates[1]).toFixed(4)}, ${Number(coordinates[0]).toFixed(4)}`, "ni-hotspot-popup-metric");
  }
  content.append(details);

  const note = document.createElement("p");
  note.className = "ni-hotspot-popup-note";
  note.textContent = properties.demo
    ? "Dato demostrativo; no representa un foco real."
    : "Señal orientativa; no confirma por sí sola un incendio.";
  content.append(note);
  return content;
}

export function FireMapViewer({ active }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [layers, setLayers] = useState({ goes: true, viirs: true, modis: true });
  const [riskMode, setRiskMode] = useState(false);
  const [meta, setMeta] = useState<HotspotResponse["meta"] | null>(null);
  const [hotspotFeatures, setHotspotFeatures] = useState<HotspotResponse["features"]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [requestDate, setRequestDate] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [latestLstDate, setLatestLstDate] = useState("");
  const hotspotFeaturesRef = useRef(hotspotFeatures);
  const layersRef = useRef(layers);
  useEffect(() => {
    hotspotFeaturesRef.current = hotspotFeatures;
  }, [hotspotFeatures]);
  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

  useEffect(() => {
    if (!active || !containerRef.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        const maplibregl = await loadMapLibre();
        if (cancelled || !containerRef.current) return;
        const map = new maplibregl.Map({
          container: containerRef.current,
          style: {
            version: 8,
            sources: {
              "satellite-imagery": {
                type: "raster",
                tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
                tileSize: 256,
                maxzoom: 19,
                attribution: "Tiles © Esri, Maxar, Earthstar Geographics, and the GIS User Community",
              },
            },
            layers: [{ id: "satellite-imagery", type: "raster", source: "satellite-imagery" }],
          },
          center: CALI_AOI.center,
          zoom: 11.5,
          attributionControl: false,
        });
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
        map.addControl(createDateFilterControl(
          (date) => {
            setSelectedDate(date);
            setRequestDate(date);
            setHotspotFeatures([]);
            setRefreshToken((value) => value + 1);
          },
          () => {
            setSelectedDate("");
            setRequestDate("");
            setHotspotFeatures([]);
            setRefreshToken((value) => value + 1);
          },
        ), "top-left");
        map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
        mapRef.current = map;

        map.on("load", () => {
          map.addSource("aoi", {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: [[
                  [CALI_AOI.west, CALI_AOI.south],
                  [CALI_AOI.east, CALI_AOI.south],
                  [CALI_AOI.east, CALI_AOI.north],
                  [CALI_AOI.west, CALI_AOI.north],
                  [CALI_AOI.west, CALI_AOI.south],
                ]],
              },
              properties: {},
            },
          });
          map.addLayer({
            id: "aoi-fill",
            type: "fill",
            source: "aoi",
            paint: { "fill-color": "#d7ff5f", "fill-opacity": 0.08 },
          });
          map.addLayer({
            id: "aoi-line",
            type: "line",
            source: "aoi",
            paint: { "line-color": "#d7ff5f", "line-width": 2, "line-dasharray": [2, 1] },
          });

          map.addSource("land-surface-temperature", {
            type: "raster",
            tiles: [lstTileUrl(lstObservationDate(requestDate, latestLstDate))],
            tileSize: 256,
            minzoom: 0,
            maxzoom: 7,
            attribution: "Land Surface Temperature: NASA LP DAAC / GIBS · MODIS Terra",
          });
          map.addLayer({
            id: "land-surface-temperature-layer",
            type: "raster",
            source: "land-surface-temperature",
            layout: { visibility: "none" },
            paint: { "raster-opacity": 0.74, "raster-resampling": "linear", "raster-fade-duration": 0 },
          }, "aoi-fill");

          map.on("click", (event) => {
            const candidates = hotspotFeaturesRef.current
              .filter((feature) => layersRef.current[String(feature.properties.source ?? "") as keyof typeof layersRef.current] === true)
              .map((feature) => {
                const coordinates = feature.geometry.coordinates as [number, number];
                const point = map.project(coordinates);
                return { feature, coordinates, distance: Math.hypot(point.x - event.point.x, point.y - event.point.y) };
              })
              .filter(({ distance }) => distance <= 18)
              .sort((a, b) => a.distance - b.distance);
            const selected = candidates[0];
            if (!selected) return;
            const visual = HOTSPOT_VISUALS.find(({ key }) => key === String(selected.feature.properties.source ?? ""));
            if (!visual) return;
            const popupScale = Math.max(0.9, Math.min(1.14, 1 + (map.getZoom() - 11.5) * 0.035));
            const popup = new maplibregl.Popup({
              closeButton: true,
              closeOnClick: true,
              offset: 14,
              maxWidth: `${Math.max(200, Math.min(320, map.getContainer().clientWidth - 24, 260 * popupScale))}px`,
              className: "ni-hotspot-popup-shell",
            });
            popup.setLngLat(selected.coordinates).setDOMContent(createHotspotPopupContent(selected.feature, visual)).addTo(map);
            popup.getElement().style.setProperty("--hotspot-color", visual.color);
            popup.getElement().style.setProperty("--hotspot-popup-scale", String(popupScale));
            const popupBody = popup.getElement().querySelector(".maplibregl-popup-content") as HTMLElement | null;
            if (popupBody) {
              popupBody.style.maxHeight = "none";
              popupBody.style.overflowY = "visible";
            }
          });
          map.on("remove", () => {
            if (animationFrameRef.current !== null) {
              window.cancelAnimationFrame(animationFrameRef.current);
              animationFrameRef.current = null;
            }
          });
          setMapReady(true);
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo cargar el mapa");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    discoverLatestLstDate()
      .then((date) => { if (!cancelled && date) setLatestLstDate(date); })
      .catch(() => { /* keep a conservative fallback date if the domain service is unavailable */ });
    return () => { cancelled = true; };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "");
        const query = requestDate ? `?date=${encodeURIComponent(requestDate)}` : "";
        const endpoints = [
          apiBase ? `${apiBase}/nature/thermal/hotspots${query}` : null,
          `/api/nature/hotspots${query}`,
        ].filter(Boolean) as string[];
        let data: HotspotResponse | null = null;
        let lastError: Error | null = null;
        for (const endpoint of endpoints) {
          try {
            const res = await fetch(endpoint, { cache: "no-store" });
            if (!res.ok) {
              let detail = "";
              try {
                const body = await res.json();
                detail = String(body.message ?? body.error ?? "");
              } catch { /* use the HTTP status when the response is not JSON */ }
              throw new Error(detail || `${endpoint} HTTP ${res.status}`);
            }
            data = (await res.json()) as HotspotResponse;
            break;
          } catch (error) {
            lastError = error instanceof Error ? error : new Error("Thermal feed unavailable");
          }
        }
        if (!data) throw lastError ?? new Error("Thermal feed unavailable");
        if (cancelled) return;
        setMeta(data.meta);
        const features = (data.features || []).filter((feature) =>
          !requestDate || String(feature.properties.acq_date ?? "") === requestDate,
        );
        setHotspotFeatures(features);
        if (features.length && mapRef.current) {
          const longitudes = features.map((feature) => feature.geometry.coordinates[0]);
          const latitudes = features.map((feature) => feature.geometry.coordinates[1]);
          mapRef.current.fitBounds([
            [Math.min(CALI_AOI.west, ...longitudes), Math.min(CALI_AOI.south, ...latitudes)],
            [Math.max(CALI_AOI.east, ...longitudes), Math.max(CALI_AOI.north, ...latitudes)],
          ], { padding: 28, maxZoom: 11.5, duration: 0 });
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error cargando focos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, requestDate, refreshToken]);

  const visibleFeatures = hotspotFeatures;
  const riskMapData = useMemo(() => buildRiskMapData(visibleFeatures, layers), [visibleFeatures, layers]);
  const visibleCounts = { goes: 0, viirs: 0, modis: 0 };
  for (const feature of visibleFeatures) {
    const source = String(feature.properties.source ?? "");
    if (source in visibleCounts) visibleCounts[source as keyof typeof visibleCounts] += 1;
  }

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const sync = () => {
      const thermalSource = map.getSource("land-surface-temperature");
      if (thermalSource?.setTiles) {
        thermalSource.setTiles([lstTileUrl(lstObservationDate(requestDate, latestLstDate))]);
      }
      if (map.getLayer("land-surface-temperature-layer")) {
        map.setLayoutProperty("land-surface-temperature-layer", "visibility", riskMode ? "visible" : "none");
      }
    };
    if (map.isStyleLoaded?.()) sync();
    else map.once?.("load", sync);
  }, [latestLstDate, mapReady, requestDate, riskMode]);

  useEffect(() => {
    const map = mapRef.current;
    const canvas = overlayRef.current;
    if (!map || !mapReady || !canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let frame = 0;
    const renderOverlay = () => {
      const { width, height } = map.getContainer().getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(width * scale) || canvas.height !== Math.round(height * scale)) {
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        context.setTransform(scale, 0, 0, scale, 0, 0);
      }
      context.clearRect(0, 0, width, height);
      const zoomScale = Math.max(0.82, Math.min(1.4, 1 + (map.getZoom() - 11.5) * 0.055));
      const pulsePhase = (performance.now() % 2600) / 2600;
      visibleFeatures.forEach((feature, index) => {
        const visual = HOTSPOT_VISUALS.find(({ key }) => key === String(feature.properties.source ?? ""));
        if (!visual || !layers[String(feature.properties.source ?? "") as keyof typeof layers]) return;
        const point = map.project(feature.geometry.coordinates);
        if (point.x < -48 || point.x > width + 48 || point.y < -48 || point.y > height + 48) return;
        const phase = (pulsePhase + index * 0.21) % 1;
        const pulseRadius = Math.max(8, visual.pulseMaxRadius * zoomScale * (0.25 + phase * 0.75));
        context.globalAlpha = 0.82 * (1 - phase);
        context.strokeStyle = visual.color;
        context.lineWidth = 1.6;
        context.beginPath();
        context.arc(point.x, point.y, pulseRadius, 0, Math.PI * 2);
        context.stroke();
        context.globalAlpha = 0.32;
        context.beginPath();
        context.arc(point.x, point.y, pulseRadius * 0.68, 0, Math.PI * 2);
        context.stroke();
        context.globalAlpha = 1;
        context.beginPath();
        context.arc(point.x, point.y, Math.max(4, 5 * zoomScale), 0, Math.PI * 2);
        context.fillStyle = visual.color;
        context.fill();
        context.lineWidth = 1.7;
        context.strokeStyle = "#fff4df";
        context.stroke();
      });

      if (riskMode) for (const { coordinates, score } of riskMapData.labels) {
        const point = map.project(coordinates);
        const text = `${score}%`;
        const fontSize = Math.round((9 + score * 0.045) * zoomScale);
        context.font = `750 ${fontSize}px system-ui, sans-serif`;
        context.textBaseline = "bottom";
        const x = point.x + 19 * zoomScale;
        const y = point.y - 20 * zoomScale;
        context.lineJoin = "round";
        context.lineWidth = Math.max(2.5, fontSize * 0.22);
        context.strokeStyle = "rgba(0,0,0,.96)";
        context.strokeText(text, x, y);
        context.fillStyle = "#fff";
        context.fillText(text, x, y);
      }
      context.globalAlpha = 1;
      frame = window.requestAnimationFrame(renderOverlay);
    };
    renderOverlay();
    return () => {
      window.cancelAnimationFrame(frame);
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [layers, mapReady, riskMapData, riskMode, visibleFeatures]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="ni-viewer-shell">
      <aside className="ni-viewer-side">
        <div className="ni-viewer-heading-row">
          <div className="ni-viewer-heading-copy">
            <p className="ni-viewer-kicker">AOI · {CALI_AOI.name}</p>
            <h3>Capas térmicas</h3>
          </div>
          <button
            type="button"
            className={`ni-risk-trigger${riskMode ? " is-active" : ""}`}
            role="switch"
            aria-checked={riskMode}
            aria-label={`${riskMode ? "Desactivar" : "Activar"} alerta temprana`}
            title={riskMode ? "Volver a la vista de focos" : "Activar visualización experimental de alerta temprana"}
            onClick={() => setRiskMode((enabled) => !enabled)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3v9" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
              <path d="M7.05 5.9a8 8 0 1 0 9.9 0" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
            <span>Alerta<br />temprana</span>
          </button>
        </div>
        {riskMode ? (
          <p className="ni-risk-disclaimer">
            Temperatura superficial MODIS Terra · {lstObservationDate(requestDate, latestLstDate)}. Vacíos = sin observación.
            Porcentajes: intensidad relativa de FRP local (escala logarítmica, solo ≥50%); no son probabilidad ni pronóstico.
          </p>
        ) : null}
        <div className="ni-toggles">
          {HOTSPOT_VISUALS.map(({ key, label, provider, color }) => (
            <label key={key} className="ni-toggle">
              <input
                type="checkbox"
                checked={layers[key]}
                onChange={() => setLayers((s) => ({ ...s, [key]: !s[key] }))}
              />
              <span className="ni-swatch" style={{ background: color }} />
              <span className="ni-layer-name">{label}</span>
              <span className="ni-provider">{provider}</span>
            </label>
          ))}
        </div>
        <div className="ni-stats ni-fire-stats">
          <div><span>Modo</span><strong>{meta?.mode ?? "—"}</strong></div>
          <div><span>GOES</span><strong>{visibleCounts.goes}</strong></div>
          <div><span>VIIRS</span><strong>{visibleCounts.viirs}</strong></div>
          <div><span>MODIS</span><strong>{visibleCounts.modis}</strong></div>
          <div><span>CRITICAL</span><strong>{meta?.counts?.critical ?? 0}</strong></div>
        </div>
        {selectedDate ? <p className="ni-muted ni-date-summary">Fecha {selectedDate}: {visibleFeatures.length} señales cargadas</p> : null}
        {meta?.warning ? <p className="ni-warn">{meta.warning}</p> : null}
        {loading ? <p className="ni-muted">Actualizando focos…</p> : null}
        {error ? <p className="ni-warn">{error}</p> : null}
        <p className="ni-muted">
          Imagen de referencia Esri: detalle y fecha de captura varían según la zona. FIRMS: VIIRS ≈375 m y MODIS ≈1 km de resolución nominal; las señales llegan casi en tiempo real y requieren validación humana.
        </p>
      </aside>
      <div className="ni-map-stage">
        <div className="ni-map-wrap" ref={containerRef} />
        <canvas className="ni-map-overlay" ref={overlayRef} aria-label="Focos térmicos y concentración relativa" />
      </div>
    </div>
  );
}
