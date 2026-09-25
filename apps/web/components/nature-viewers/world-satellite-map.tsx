"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { loadMapLibre, type MapLibreMap } from "@/components/nature-viewers/fire-map";
import styles from "./world-satellite-map.module.css";

type Place = { label: string; aliases: string[]; center: [number, number]; zoom: number };
type MapHandle = MapLibreMap;
const PLACES: Place[] = [
  { label: "Santiago de Cali", aliases: ["cali", "santiago de cali"], center: [-76.53, 3.45], zoom: 9 },
  { label: "Bogotá", aliases: ["bogota", "bogotá"], center: [-74.08, 4.65], zoom: 7 },
  { label: "Parque Nacional Tayrona", aliases: ["tayrona", "parque tayrona"], center: [-73.88, 11.31], zoom: 9 },
  { label: "Amazonía", aliases: ["amazonia", "amazonía"], center: [-63, -3.5], zoom: 4 },
  { label: "Río Amazonas", aliases: ["rio amazonas", "río amazonas", "amazon river"], center: [-60, -3], zoom: 5 },
  { label: "Islas Galápagos", aliases: ["galapagos", "galápagos"], center: [-90.5, -0.5], zoom: 6 },
  { label: "Desierto del Sahara", aliases: ["sahara", "desierto del sahara"], center: [13, 23], zoom: 4 },
  { label: "Bruselas", aliases: ["bruselas", "brussels"], center: [4.3517, 50.8503], zoom: 7 },
  { label: "Nueva York", aliases: ["nueva york", "new york", "nyc"], center: [-74.006, 40.7128], zoom: 7 },
  { label: "Himalaya", aliases: ["himalaya", "himalayas"], center: [86, 28], zoom: 4 },
  { label: "Gran Barrera de Coral", aliases: ["gran barrera de coral", "great barrier reef"], center: [147, -18], zoom: 5 },
];

function normalize(value: string) {
  return value.trim().toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function WorldSatelliteMap() {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapHandle | null>(null);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [mapError, setMapError] = useState(false);
  const listId = useId().replace(/:/g, "");

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;
    let cancelled = false;
    let instance: MapHandle | null = null;
    const markers: Array<{ remove: () => void }> = [];

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
          center: [-36.6, 34.5],
          zoom: 0.65,
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

          const cityMarkers = [
            { name: "Bruselas", center: [4.3517, 50.8503] as [number, number], className: styles.cityBrussels },
            { name: "Nueva York", center: [-74.006, 40.7128] as [number, number], className: styles.cityNewYork },
            { name: "Bogotá", center: [-74.08, 4.65] as [number, number], className: styles.cityBogota },
          ];

          for (const city of cityMarkers) {
            const element = document.createElement("div");
            element.className = `${styles.cityMarker} ${city.className}`;
            element.setAttribute("aria-label", city.name);
            const rings = document.createElement("span");
            rings.className = styles.cityRings;
            const dot = document.createElement("span");
            dot.className = styles.cityDot;
            const label = document.createElement("span");
            label.className = styles.cityLabel;
            label.textContent = city.name;
            element.append(rings, dot, label);
            const marker = new maplibregl.Marker({ element, anchor: "center" })
              .setLngLat(city.center)
              .addTo(map);
            markers.push(marker);
          }
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
    const place = PLACES.find((item) => item.aliases.some((alias) => normalize(alias) === normalized || normalized.includes(normalize(alias))));
    if (!place) {
      setNotice("Prueba un lugar destacado de la lista o escribe latitud, longitud.");
      return;
    }
    mapRef.current?.flyTo({ center: place.center, zoom: place.zoom, duration: 1600 });
    setQuery(place.label);
    setNotice(`Vista centrada en ${place.label}`);
  }

  return (
    <div className={styles.frame}>
      <div ref={mapElement} className={styles.mapCanvas} role="application" aria-label="Mapa satelital global interactivo" />
      <form className={styles.search} onSubmit={search} role="search">
        <label className={styles.searchLabel} htmlFor={`${listId}-query`}>BUSCAR EN EL PLANETA</label>
        <div className={styles.searchRow}>
          <input
            id={`${listId}-query`}
            aria-label="Buscar un lugar o coordenadas"
            list={`${listId}-places`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Lugar o latitud, longitud"
            autoComplete="off"
          />
          <datalist id={`${listId}-places`}>
            {PLACES.map((place) => <option key={place.label} value={place.label} />)}
          </datalist>
          <button type="submit" aria-label="Buscar ubicación">↗</button>
        </div>
      </form>
      <div className={styles.scanLine} aria-hidden="true" />
      <div className={styles.mapStatus}>
        <span>IMAGEN SATELITAL GLOBAL</span>
        <span>ESRI WORLD IMAGERY · MOSAICO</span>
      </div>
      {notice ? <p className={styles.mapNotice} aria-hidden="true">{notice}</p> : null}
      <p className={styles.srOnly} role="status" aria-live="polite">
        {mapError ? "No se pudo cargar el mapa. Revisa la conexión a internet." : notice}
      </p>
      {mapError ? <span className={styles.mapError}>Mapa no disponible · verifica la conexión</span> : null}
    </div>
  );
}
