"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { commercialPorts, copernicusServiceCentres, maritimeCorridors, type CommercialPort, type CopernicusServiceCentre } from "@/lib/eudr-maritime";
import styles from "./eudr-copernicus-map.module.css";

type MapPoint = [number, number];
const DEFAULT_MAP_VIEW = { center: [-36.6, 16] as MapPoint, zoom: 0.65 };
type MapLibreMap = {
  addControl(control: unknown, position?: string): void;
  addSource(sourceId: string, source: unknown): void;
  addLayer(layer: unknown): void;
  once(event: string, listener: () => void): void;
  flyTo(options: { center: MapPoint; zoom: number; duration: number }): void;
  remove(): void;
};
type MapLibreMarker = { setLngLat(point: MapPoint): MapLibreMarker; addTo(map: MapLibreMap): MapLibreMarker; remove(): void };
type MapLibreNamespace = {
  Map: new (options: Record<string, unknown>) => MapLibreMap;
  NavigationControl: new (options: { showCompass: boolean }) => unknown;
  AttributionControl: new (options: { compact: boolean }) => unknown;
  Marker: new (options: { element: HTMLElement; anchor?: string; offset?: [number, number] }) => MapLibreMarker;
};

function loadMapLibre(): Promise<MapLibreNamespace> {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  const browserWindow = window as Window & { maplibregl?: MapLibreNamespace };
  if (browserWindow.maplibregl) return Promise.resolve(browserWindow.maplibregl);
  return new Promise((resolve, reject) => {
    if (!document.getElementById("maplibre-css")) {
      const link = document.createElement("link");
      link.id = "maplibre-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css";
      document.head.appendChild(link);
    }
    const existing = document.querySelector("script[data-maplibre]");
    if (existing) {
      existing.addEventListener("load", () => browserWindow.maplibregl ? resolve(browserWindow.maplibregl) : reject(new Error("maplibre load failed")));
      existing.addEventListener("error", () => reject(new Error("maplibre load failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js";
    script.async = true;
    script.dataset.maplibre = "1";
    script.onload = () => browserWindow.maplibregl ? resolve(browserWindow.maplibregl) : reject(new Error("maplibre load failed"));
    script.onerror = () => reject(new Error("maplibre load failed"));
    document.body.appendChild(script);
  });
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function addCentreMarker(maplibregl: MapLibreNamespace, map: MapLibreMap, centre: CopernicusServiceCentre) {
  const element = document.createElement("div");
  element.className = `${styles.centreMarker} ${styles[centre.className as keyof typeof styles]}`;
  element.setAttribute("aria-label", `${centre.label}: ${centre.service}, ${centre.operator}, estado ${centre.status}`);
  element.title = `${centre.label} · ${centre.service} · ${centre.operator} · ${centre.status}`;
  const rings = document.createElement("span");
  rings.className = styles.centreRings;
  const dot = document.createElement("span");
  dot.className = styles.centreDot;
  const label = document.createElement("span");
  label.className = `${styles.centreLabel} ${centre.id === "aig-panama" ? styles.centreLabelAbove : ""}`;
  label.textContent = centre.label;
  element.append(rings, dot, label);
  return new maplibregl.Marker({ element, anchor: "center" }).setLngLat(centre.center).addTo(map);
}

function addPortMarker(maplibregl: MapLibreNamespace, map: MapLibreMap, port: CommercialPort) {
  const element = document.createElement("div");
  element.className = styles.portMarker;
  element.setAttribute("aria-label", `Puerto mercantil: ${port.name}, ${port.country}`);
  element.title = `${port.rank}. ${port.name} · ${port.country} · ${new Intl.NumberFormat("es-CO").format(port.throughputTeu)} TEU en 2024`;
  return new maplibregl.Marker({ element, anchor: "center", offset: port.mapOffset }).setLngLat(port.center).addTo(map);
}

export function EudrCopernicusMap() {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [mapError, setMapError] = useState(false);
  const listId = useId().replace(/:/g, "");

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;
    let cancelled = false;
    let instance: MapLibreMap | null = null;
    const markers: MapLibreMarker[] = [];

    void (async () => {
      try {
        const maplibregl = await loadMapLibre();
        if (cancelled || !mapElement.current) return;
        const map = new maplibregl.Map({
          container: mapElement.current,
          style: {
            version: 8,
            sources: {
              "global-satellite": {
                type: "raster",
                tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
                tileSize: 256,
                maxzoom: 19,
                attribution: "Tiles © Esri, Maxar, Earthstar Geographics, and the GIS User Community",
              },
            },
            layers: [{ id: "global-satellite", type: "raster", source: "global-satellite" }],
          },
          center: DEFAULT_MAP_VIEW.center,
          zoom: DEFAULT_MAP_VIEW.zoom,
          minZoom: 0.65,
          maxZoom: 18,
          renderWorldCopies: true,
          attributionControl: false,
        });
        instance = map;
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
        map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
        map.once("load", () => {
          if (cancelled) return;
          setMapError(false);
          map.addSource("maritime-corridors", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: maritimeCorridors.map((corridor) => ({
                type: "Feature",
                properties: { id: corridor.id, name: corridor.name, mode: corridor.mode },
                geometry: { type: "LineString", coordinates: corridor.mapPath },
              })),
            },
          });
          map.addLayer({
            id: "maritime-corridors-halo",
            type: "line",
            source: "maritime-corridors",
            paint: { "line-color": "#ff7a3d", "line-width": 3, "line-opacity": 0.11 },
          });
          map.addLayer({
            id: "maritime-corridors",
            type: "line",
            source: "maritime-corridors",
            paint: { "line-color": "#ff9a6e", "line-width": 1.25, "line-opacity": 0.72, "line-dasharray": [2, 3] },
          });
          commercialPorts.forEach((port) => markers.push(addPortMarker(maplibregl, map, port)));
          copernicusServiceCentres.forEach((centre) => markers.push(addCentreMarker(maplibregl, map, centre)));
        });
        mapRef.current = map;
      } catch {
        if (!cancelled) setMapError(true);
      }
    })();

    return () => {
      cancelled = true;
      markers.forEach((marker) => marker.remove());
      instance?.remove();
      mapRef.current = null;
    };
  }, []);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = query.trim();
    const coordinates = raw.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (coordinates) {
      const lat = Number(coordinates[1]);
      const lon = Number(coordinates[2]);
      if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        setNotice("Coordenadas fuera de rango. Usa latitud, longitud.");
        return;
      }
      mapRef.current?.flyTo({ center: [lon, lat], zoom: 8, duration: 1500 });
      setNotice(`Vista centrada en ${lat.toFixed(3)}, ${lon.toFixed(3)}`);
      return;
    }
    const normalized = normalize(raw);
    const centre = copernicusServiceCentres.find((item) => item.aliases.some((alias) => normalize(alias) === normalized || normalized.includes(normalize(alias))));
    if (!centre) {
      setNotice("Prueba Santiago, Panamá, Bogotá, Brazzaville, Túnez, Luxemburgo, Bengaluru, Tokio, Abuya o Manila.");
      return;
    }
    mapRef.current?.flyTo({ center: centre.center, zoom: 8, duration: 1600 });
    setQuery(centre.label);
    setNotice(`Vista centrada en ${centre.label} · ${centre.service}`);
  }

  return (
    <div className={styles.frame}>
      <div ref={mapElement} className={styles.mapCanvas} role="application" aria-label="Mapa satelital global con centros regionales Copernicus y los quince puertos de contenedores líderes de América Latina y el Caribe" />
      <form className={styles.search} onSubmit={search} role="search">
        <label className={styles.searchLabel} htmlFor={`${listId}-query`}>BUSCAR CENTRO COPERNICUS</label>
        <div className={styles.searchRow}>
          <input id={`${listId}-query`} aria-label="Buscar un centro Copernicus" list={`${listId}-places`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Centro o latitud, longitud" autoComplete="off" />
          <datalist id={`${listId}-places`}>
            {copernicusServiceCentres.map((centre) => <option key={centre.id} value={centre.label} />)}
          </datalist>
          <button type="submit" aria-label="Buscar centro Copernicus">↗</button>
        </div>
      </form>
      <div className={styles.scanLine} aria-hidden="true" />
      <div className={styles.mapStatus}><span>IMAGEN SATELITAL GLOBAL</span><span>15 PUERTOS · RANKING CEPAL 2024</span></div>
      <div className={styles.mapCaption}>CORREDORES MARÍTIMOS · CONTEXTO</div>
      {notice ? <p className={styles.mapNotice} aria-hidden="true">{notice}</p> : null}
      <p className={styles.srOnly} role="status" aria-live="polite">{mapError ? "No se pudo cargar el mapa. Revisa la conexión a internet." : notice}</p>
      {mapError ? <span className={styles.mapError}>Mapa no disponible · verifica la conexión</span> : null}
    </div>
  );
}
