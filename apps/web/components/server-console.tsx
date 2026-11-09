"use client";

import { FormEvent, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Brand } from "@/components/brand";
import { ArrowRight, CheckIcon, CloseIcon } from "@/components/icons";
import { loadMapLibre, type MapLibreMap } from "@/components/nature-viewers/fire-map";
import styles from "./server-console.module.css";

type Modal = "survey" | "history" | null;
type HistoryTab = "history" | "inputs" | "market";
type Layer = "thermal" | "ice" | "magnetic" | "topo" | "radar";
type ParcelRecord = {
  id: string;
  createdAt: string;
  points: Array<{ lat: number; lon: number }>;
  location: { lat: number; lon: number } | null;
  accuracy: number | null;
  crop: string;
  harvestYear: string;
  volume: string;
  destination: string;
  producer: string;
  layer?: Layer;
};
type ServerMap = MapLibreMap & {
  getCenter(): { lat: number; lng: number };
  zoomIn(options?: { duration?: number }): void;
  zoomOut(options?: { duration?: number }): void;
};

const layerLabels: Record<Layer, string> = {
  thermal: "SIEMBRA 1",
  ice: "SIEMBRA 2",
  magnetic: "SIEMBRA 3",
  topo: "SIEMBRA 4",
  radar: "SIEMBRA 5",
};

const satelliteFallbackUrl =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=-78,1,-72,8&bboxSR=4326&imageSR=4326&size=1400,900&format=jpg&f=image";

function productPrefix(value: string) {
  const normalized = String(value || "").trim().toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (normalized.includes("cacao")) return "CA";
  if (normalized.includes("cafe") || normalized.includes("coffee")) return "CO";
  return normalized.replace(/[^a-z]/g, "").slice(0, 2).toUpperCase() || "NA";
}

const authorizedUsers: Record<string, string> = {
  heider_01: "heider_01@users.symmetry.local",
  admin_00: "admin@users.symmetry.local",
};

function usernameEmail(username: string) {
  const normalized = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
  return authorizedUsers[normalized] ?? null;
}

export function ServerConsole() {
  const [activeLayers, setActiveLayers] = useState<Layer[]>(["thermal", "ice", "magnetic"]);
  const [modal, setModal] = useState<Modal>(null);
  const [toast, setToast] = useState("");
  const [points, setPoints] = useState<Array<{ lat: number; lon: number }>>([]);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "requesting" | "ready" | "denied">("idle");
  const [scanStatus, setScanStatus] = useState<"idle" | "capturing" | "closed">("idle");
  const [historyTab, setHistoryTab] = useState<HistoryTab>("history");
  const [records, setRecords] = useState<ParcelRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ParcelRecord | null>(null);
  const passportGridRef = useRef<HTMLDivElement>(null);
  const [passportGridHeight, setPassportGridHeight] = useState(0);
  const [mapCenter, setMapCenter] = useState({ lat: 4.65, lon: -74.08 });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<ServerMap | null>(null);
  const layersStripRef = useRef<HTMLDivElement>(null);
  const layerDragRef = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });
  const supabase = useMemo(() => createClient(), []);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(() => Boolean(supabase));
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState(() =>
    supabase ? "" : "Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
  );
  const [saving, setSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"offline" | "connecting" | "online" | "degraded">(() =>
    supabase ? "connecting" : "offline",
  );

  const loadRecords = async (userId: string) => {
    if (!supabase) {
      setSyncStatus("offline");
      return;
    }
    setSyncStatus("connecting");
    const { data, error } = await supabase
      .from("eudr_parcels")
      .select("id, created_at, points, location, accuracy_m, crop, harvest_year, volume, destination, producer, layer")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      setAuthError("No fue posible cargar tus polígonos desde Supabase.");
      setSyncStatus("degraded");
      return;
    }

    const normalized = (data ?? []).map((row) => ({
      id: String(row.id),
      createdAt: String(row.created_at),
      points: Array.isArray(row.points) ? row.points as Array<{ lat: number; lon: number }> : [],
      location: row.location && typeof row.location === "object" ? row.location as { lat: number; lon: number } : null,
      accuracy: typeof row.accuracy_m === "number" ? row.accuracy_m : null,
      crop: String(row.crop ?? ""),
      harvestYear: row.harvest_year == null ? "" : String(row.harvest_year),
      volume: String(row.volume ?? ""),
      destination: String(row.destination ?? ""),
      producer: String(row.producer ?? ""),
      layer: row.layer as Layer | undefined,
    })) as ParcelRecord[];

    setRecords(normalized);
    setSyncStatus("online");
    const latest = normalized[0];
    if (!latest) return;
    setPoints(latest.points);
    setUserLocation(latest.location);
    setGpsLocation(latest.location);
    setAccuracy(latest.accuracy);
    setScanStatus("idle");
  };

  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;
    const restoreSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      setAuthUser(data.user ?? null);
      setAuthLoading(false);
      if (data.user) void loadRecords(data.user.id);
    };

    void restoreSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setAuthUser(session?.user ?? null);
      setAuthLoading(false);
      if (session?.user) window.setTimeout(() => void loadRecords(session.user.id), 0);
      else {
        setRecords([]);
        setSyncStatus("offline");
      }
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (authUser) return;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [authUser]);

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return;
    let cancelled = false;
    let instance: ServerMap | null = null;
    let loaded = false;
    let loadTimer: number | null = null;

    void (async () => {
      try {
        const maplibregl = await loadMapLibre();
        if (cancelled || !mapElementRef.current) return;
        const map = new maplibregl.Map({
          container: mapElementRef.current,
          style: {
            version: 8,
            sources: {
              "server-satellite": {
                type: "raster",
                tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
                tileSize: 256,
                maxzoom: 19,
                attribution: "Tiles © Esri, Maxar, Earthstar Geographics, and the GIS User Community",
              },
              "server-polygon": {
                type: "geojson",
                data: { type: "FeatureCollection", features: [] },
              },
              "server-archives": {
                type: "geojson",
                data: { type: "FeatureCollection", features: [] },
              },
            },
            layers: [
              { id: "server-satellite", type: "raster", source: "server-satellite" },
              {
                id: "server-polygon-fill",
                type: "fill",
                source: "server-polygon",
                filter: ["==", ["geometry-type"], "Polygon"],
                paint: { "fill-color": "#c9ff3f", "fill-opacity": 0.16 },
              },
              {
                id: "server-polygon-line",
                type: "line",
                source: "server-polygon",
                paint: { "line-color": "#ff4e20", "line-width": 3, "line-opacity": 0.92 },
              },
              {
                id: "server-polygon-points",
                type: "circle",
                source: "server-polygon",
                filter: ["==", ["geometry-type"], "Point"],
                paint: {
                  "circle-color": "#c9ff3f",
                  "circle-radius": 6,
                  "circle-stroke-color": "#101411",
                  "circle-stroke-width": 2,
                },
              },
              {
                id: "server-archive-fill",
                type: "fill",
                source: "server-archives",
                paint: {
                  "fill-color": ["match", ["get", "layer"], "thermal", "#7cdcff", "ice", "#ff4e20", "magnetic", "#c9ff3f", "topo", "#a98cff", "radar", "#ffd166", "#7cdcff"],
                  "fill-opacity": 0.16,
                },
              },
              {
                id: "server-archive-line",
                type: "line",
                source: "server-archives",
                paint: {
                  "line-color": ["match", ["get", "layer"], "thermal", "#7cdcff", "ice", "#ff4e20", "magnetic", "#c9ff3f", "topo", "#a98cff", "radar", "#ffd166", "#7cdcff"],
                  "line-width": 2,
                  "line-opacity": 0.95,
                },
              },
            ],
          },
          center: [-74.08, 4.65],
          zoom: 6,
          minZoom: 2,
          maxZoom: 18,
          renderWorldCopies: true,
          attributionControl: false,
        }) as ServerMap;
        instance = map;
        map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
        map.on("error", () => {
          if (!cancelled) setMapError(true);
        });
        map.once("load", () => {
          if (cancelled) return;
          loaded = true;
          if (loadTimer !== null) window.clearTimeout(loadTimer);
          const center = map.getCenter();
          setMapCenter({ lat: center.lat, lon: center.lng });
          setMapReady(true);
          setMapError(false);
        });
        map.on("move", () => {
          if (cancelled) return;
          const center = map.getCenter();
          setMapCenter({ lat: center.lat, lon: center.lng });
        });
        mapRef.current = map;
        loadTimer = window.setTimeout(() => {
          if (!cancelled && !loaded) setMapError(true);
        }, 12000);
      } catch {
        if (!cancelled) setMapError(true);
      }
    })();

    return () => {
      cancelled = true;
      if (loadTimer !== null) window.clearTimeout(loadTimer);
      instance?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const source = mapRef.current?.getSource("server-polygon");
    if (!source?.setData) return;
    if (scanStatus === "idle") {
      source.setData({ type: "FeatureCollection", features: [] });
      return;
    }
    const coordinates = points.map((point) => [point.lon, point.lat]);
    const features: Array<Record<string, unknown>> = coordinates.map((coordinate, index) => ({
      type: "Feature",
      properties: { vertex: index + 1 },
      geometry: { type: "Point", coordinates: coordinate },
    }));
    if (coordinates.length >= 2) {
      const lineCoordinates = scanStatus === "closed" && coordinates.length >= 3
        ? [...coordinates, coordinates[0]]
        : coordinates;
      features.unshift({
        type: "Feature",
        properties: { closed: scanStatus === "closed" },
        geometry: {
          type: scanStatus === "closed" && coordinates.length >= 3 ? "Polygon" : "LineString",
          coordinates: scanStatus === "closed" && coordinates.length >= 3 ? [lineCoordinates] : lineCoordinates,
        },
      });
    }
    source.setData({ type: "FeatureCollection", features });
  }, [mapReady, points, scanStatus]);

  useEffect(() => {
    const source = mapRef.current?.getSource("server-archives");
    if (!source?.setData) return;
    const layerKeys = Object.keys(layerLabels) as Layer[];
    const features = records.flatMap((record, index) => {
      const ring = record.points.length >= 3
        ? [...record.points, record.points[0]].map((point) => [point.lon, point.lat])
        : [];
      const layer = record.layer || layerKeys[index % layerKeys.length];
      if (ring.length === 0 || !activeLayers.includes(layer)) return [];
      return [{
        type: "Feature",
        properties: { layer, recordId: record.id },
        geometry: { type: "Polygon", coordinates: [ring] },
      }];
    });
    source.setData({ type: "FeatureCollection", features });
  }, [activeLayers, mapReady, records]);

  useEffect(() => {
    const element = passportGridRef.current;
    if (!element) return;
    const measure = () => setPassportGridHeight(element.getBoundingClientRect().height);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [selectedRecord, historyTab]);

  useEffect(() => {
    if (!mapReady || !userLocation) return;
    mapRef.current?.flyTo({ center: [userLocation.lon, userLocation.lat], zoom: 15, duration: 900 });
  }, [mapReady, userLocation]);

  const announce = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  };

  const toggleLayer = (layer: Layer) => {
    const enabled = !activeLayers.includes(layer);
    setActiveLayers((current) => enabled ? [...current, layer] : current.filter((item) => item !== layer));
    announce(`${layerLabels[layer]} ${enabled ? "ON" : "OFF"}`);
  };

  const startLayerDrag = (event: PointerEvent<HTMLDivElement>) => {
    const strip = layersStripRef.current;
    if (!strip) return;
    layerDragRef.current = { active: true, startX: event.clientX, scrollLeft: strip.scrollLeft, moved: false };
  };

  const moveLayerDrag = (event: PointerEvent<HTMLDivElement>) => {
    const strip = layersStripRef.current;
    if (!strip || !layerDragRef.current.active) return;
    const delta = event.clientX - layerDragRef.current.startX;
    if (Math.abs(delta) > 4) layerDragRef.current.moved = true;
    strip.scrollLeft = layerDragRef.current.scrollLeft - (delta * 1.1);
    event.preventDefault();
  };

  const endLayerDrag = () => {
    layerDragRef.current.active = false;
  };

  const toggleLayerFromPointer = (event: MouseEvent<HTMLButtonElement>, layer: Layer) => {
    if (layerDragRef.current.moved) {
      event.preventDefault();
      layerDragRef.current.moved = false;
      return;
    }
    toggleLayer(layer);
  };

  const requestLocation = (onReady?: (position: { lat: number; lon: number }) => void) => {
    setLocationStatus("requesting");
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      announce("GPS no disponible en este navegador");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position = { lat: coords.latitude, lon: coords.longitude };
        setGpsLocation(position);
        setUserLocation(position);
        setAccuracy(Math.round(coords.accuracy));
        setLocationStatus("ready");
        announce("Ubicación GPS enlazada al visor");
        onReady?.(position);
      },
      () => {
        setLocationStatus("denied");
        announce("Permiso GPS pendiente; puedes mover el mapa manualmente");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const centerOnGps = () => {
    if (!gpsLocation) {
      requestLocation((position) => {
        mapRef.current?.flyTo({ center: [position.lon, position.lat], zoom: 15, duration: 900 });
        announce("Ubicación GPS enlazada y centrada");
      });
      return;
    }

    mapRef.current?.flyTo({ center: [gpsLocation.lon, gpsLocation.lat], zoom: 15, duration: 650 });
    announce("Mapa centrado en la posición GPS");
  };

  const fixPoint = () => {
    const map = mapRef.current;
    if (!mapReady || !map) {
      announce("El visor todavía está cargando");
      return;
    }
    const center = map.getCenter();
    const position = { lat: center.lat, lon: center.lng };
    setPoints((current) => [...current, position]);
    setUserLocation(position);
    setAccuracy(null);
    announce(`Vértice ${points.length + 1} fijado en el centro del visor`);
  };

  const startScan = () => {
    setPoints([]);
    setAccuracy(null);
    setUserLocation(null);
    setGpsLocation(null);
    setLocationStatus("idle");
    setScanStatus("capturing");
    setModal(null);
    requestLocation();
  };

  const closePolygon = () => {
    if (points.length < 3) {
      announce("Fija mínimo 3 vértices para cerrar el polígono");
      return;
    }
    setScanStatus("closed");
    setModal("survey");
  };

  const undoLastPoint = () => {
    if (points.length === 0) {
      announce("Todavía no hay vértices para ajustar");
      return;
    }
    const nextPoints = points.slice(0, -1);
    setPoints(nextPoints);
    setUserLocation(nextPoints[nextPoints.length - 1] || null);
    setAccuracy(null);
    announce("Último vértice retirado para reajustarlo");
  };

  const finishScan = () => {
    if (scanStatus === "capturing") {
      announce("Cierra el polígono antes de finalizar el scan");
      return;
    }
    setScanStatus("idle");
    setUserLocation(null);
    setGpsLocation(null);
    setLocationStatus("idle");
    announce("Scan finalizado");
  };

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    setAuthMessage("");
    setAuthError("");
    const username = authUsername.trim();
    if (!username || !authPassword) {
      setAuthError("Escribe tu usuario y contraseña.");
      return;
    }
    const email = usernameEmail(username);
    if (!email) {
      setAuthError("Este acceso no está autorizado.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: authPassword,
    });
    if (error) {
      setAuthError("Usuario o contraseña incorrectos.");
      return;
    }
    setAuthMessage("Sesión iniciada.");
  };

  const signOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      announce("No fue posible cerrar la sesión");
      return;
    }
    setAuthMessage("");
    setAuthError("");
    setRecords([]);
    setSelectedRecord(null);
    setSyncStatus("offline");
    announce("Sesión cerrada");
  };

  const saveSurvey = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !authUser) {
      announce("Inicia sesión antes de guardar una parcela");
      return;
    }

    setSaving(true);
    const formData = new FormData(event.currentTarget);
    const record: ParcelRecord = {
      id: productPrefix(String(formData.get("crop") || "NA")) + "-" + Date.now().toString(36).toUpperCase(),
      createdAt: new Date().toISOString(),
      points,
      location: gpsLocation || userLocation,
      accuracy,
      crop: String(formData.get("crop") || ""),
      harvestYear: String(formData.get("harvestYear") || ""),
      volume: String(formData.get("volume") || ""),
      destination: String(formData.get("destination") || ""),
      producer: String(formData.get("producer") || ""),
      layer: (Object.keys(layerLabels) as Layer[])[records.length % Object.keys(layerLabels).length],
    };

    const { data: persisted, error } = await supabase.from("eudr_parcels").insert({
      id: record.id,
      user_id: authUser.id,
      created_at: record.createdAt,
      points: record.points,
      location: record.location,
      accuracy_m: record.accuracy,
      crop: record.crop,
      harvest_year: Number(record.harvestYear) || null,
      volume: record.volume,
      destination: record.destination,
      producer: record.producer,
      layer: record.layer,
    }).select("id").single();

    setSaving(false);
    if (error) {
      setSyncStatus("degraded");
      announce("No se pudo guardar la parcela en Supabase");
      return;
    }

    if (!persisted?.id) {
      setSyncStatus("degraded");
      announce("Supabase no confirmó el registro de la parcela");
      return;
    }

    setSyncStatus("online");
    setRecords((current) => [record, ...current]);
    setModal(null);
    setScanStatus("closed");
    announce("Terreno " + record.id + " guardado para " + (authUser.email ?? "tu cuenta"));
  };

  const latitude = mapCenter.lat;
  const longitude = mapCenter.lon;
  const latitudeLabel = `${Math.abs(latitude).toFixed(4)}° ${latitude >= 0 ? "N" : "S"}`;
  const longitudeLabel = `${Math.abs(longitude).toFixed(4)}° ${longitude >= 0 ? "E" : "W"}`;
  const productTypes = Array.from(new Set(records.map((record) => record.crop).filter(Boolean)));
  const marketTypes = Array.from(new Set(records.map((record) => record.destination).filter(Boolean)));

  if (authLoading) {
    return (
      <div className={styles.authPage}>
        <section className={styles.authCard} aria-busy="true">
          <div className={styles.authLogo}><Brand /></div>
          <div className={styles.authContent}>
            <small>SYMMETRY / EUDR SERVER</small>
            <h1>Verificando <i>tu acceso.</i></h1>
            <p>Conectando tu espacio privado de trazabilidad.</p>
            <div className={styles.authFooter}><span>SUPABASE AUTH</span><span>{syncStatus.toUpperCase()}</span></div>
          </div>
        </section>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className={styles.authPage}>
        <section className={styles.authCard}>
          <div className={styles.authLogo}><Brand /></div>
          <div className={styles.authContent}>
            <small>SYMMETRY / EUDR SERVER</small>
            <h1>Iniciar <i>sesión.</i></h1>
            <p>Accede a tu consola privada para registrar parcelas y evidencia de origen.</p>
            <form className={styles.authForm} onSubmit={signIn}>
              <label className={styles.authLabel}>USUARIO<input className={styles.authInput} type="text" value={authUsername} onChange={(event) => setAuthUsername(event.target.value)} placeholder="user" autoComplete="username" required /></label>
              <label className={styles.authLabel}>CONTRASEÑA<input className={styles.authInput} type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="••••••••" autoComplete="current-password" required /></label>
              <button className={styles.authButton} type="submit">ENTRAR AL SERVER <ArrowRight /></button>
            </form>
            {authMessage && <p className={styles.authMessage}>{authMessage}</p>}
            {authError && <p className={styles.authError}>{authError}</p>}
            <div className={styles.authFooter}><span>ACCESO PRIVADO</span><span>AUTH / SUPABASE</span></div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page} data-server-page data-location-status={locationStatus}>
      <section className={styles.device} aria-label="Symmetry EUDR field visor">
        <header className={styles.deviceHeader}>
          <button className={styles.menuButton} type="button" aria-label="Open field console menu" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen((open) => !open)}><span /><span /><span /></button>
          <div className={styles.station}><span>GEOVISOR V2.4</span><strong>STATION: SYMMETRY-EUDR</strong></div>
           <div className={styles.uplink}><i /> UPLINK: {syncStatus === "online" ? "ACTIVE" : syncStatus === "connecting" ? "CONNECTING" : syncStatus === "degraded" ? "DEGRADED" : "OFFLINE"}</div>
        </header>

        <main className={styles.mapViewport}>
          <div className={`${styles.mapCanvas} ${scanStatus === "capturing" ? styles.scanningMap : ""}`}>
            <div ref={mapElementRef} className={styles.satelliteMap} role="application" aria-label="Mapa satelital global de Symmetry" />
            {!mapReady && <div className={styles.satelliteTexture} style={{ backgroundImage: `linear-gradient(rgba(10, 20, 16, .2), rgba(10, 20, 16, .2)), url("${satelliteFallbackUrl}")` }} aria-label="Vista satelital de respaldo" />}
            {mapError && <div className={styles.mapLoadNotice}>MAP ENGINE OFFLINE / CHECK SATELLITE LINK</div>}
            {scanStatus === "capturing" && <div className={styles.scanGridOverlay} aria-hidden="true" />}
            <div className={styles.satelliteBadge}>{mapError ? "SATELLITE LINK / OFFLINE" : mapReady ? "ESRI WORLD IMAGERY / ONLINE" : "SATELLITE LINK / CONNECTING"}</div>
            {scanStatus === "capturing" && <span className={styles.gpsFocus} aria-label="GPS position"><i /><small>{locationStatus === "ready" ? "GPS LOCK" : "GPS SEARCH"}</small></span>}
            {!mapReady && points.length > 1 && <svg className={styles.polygonSvg} viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Captured parcel boundary"><polyline points={points.map((_, index) => `${41 + (index % 4) * 10},${38 + (index % 3) * 13}`).join(" ")} /><polyline className={points.length >= 3 ? styles.polygonClosed : ""} points={points.length >= 3 ? `${points.map((_, index) => `${41 + (index % 4) * 10},${38 + (index % 3) * 13}`).join(" ")} 41,38` : ""} /></svg>}
            {!mapReady && points.map((point, index) => <span className={styles.vertex} key={`${point.lat}-${point.lon}`} style={{ left: `${41 + (index % 4) * 10}%`, top: `${38 + (index % 3) * 13}%` }}>{index + 1}</span>)}
            <div className={styles.zoomControls}><button type="button" aria-label="Zoom in" onClick={() => { mapRef.current?.zoomIn({ duration: 260 }); announce("Zoom +"); }}>＋</button><button type="button" aria-label="Zoom out" onClick={() => { mapRef.current?.zoomOut({ duration: 260 }); announce("Zoom −"); }}>−</button><span /></div>
            <button className={styles.compass} type="button" aria-label="Center on GPS location" onClick={centerOnGps}><span>◉</span></button>
            {scanStatus === "capturing" && <div className={styles.scanDock}><div className={styles.scanDockMeta}><span>POLYGON LAND / DEFINITION</span><strong>{String(points.length).padStart(2, "0")} VERTICES</strong></div><div className={styles.scanDockActions}><button className={styles.fixButton} type="button" onClick={fixPoint}>FIX POINT {points.length + 1}</button><button className={styles.previewButton} type="button" disabled={points.length === 0} onClick={undoLastPoint}>PREVIEW / RETURN</button><button className={styles.closeButton} type="button" disabled={points.length < 3} onClick={closePolygon}>CLOSE POLYGON <ArrowRight /></button></div></div>}
          </div>

          <div className={styles.coordinates}><span>LAT: <b>{latitudeLabel}</b></span><span>LON: <b>{longitudeLabel}</b></span><span>ALT: <b>{accuracy ? `±${accuracy}M` : "GPS—"}</b></span></div>
          <div className={styles.layers}><small>ACTIVE LAYERS</small><div ref={layersStripRef} onPointerDown={startLayerDrag} onPointerMove={moveLayerDrag} onPointerUp={endLayerDrag} onPointerCancel={() => endLayerDrag()}>{(Object.keys(layerLabels) as Layer[]).map((layer) => <button className={activeLayers.includes(layer) ? styles.layerActive : ""} type="button" key={layer} aria-pressed={activeLayers.includes(layer)} onClick={(event) => toggleLayerFromPointer(event, layer)}>{layerLabels[layer]}</button>)}</div></div>
          <div className={styles.actionDock}><button className={`${styles.scanButton} ${scanStatus === "idle" ? styles.scanButtonStrong : ""} ${scanStatus !== "idle" ? styles.scanActive : ""}`} type="button" onClick={scanStatus === "idle" ? startScan : finishScan}><span>◎</span> {scanStatus === "idle" ? "INITIATE SCAN" : "CLOSE SCAN"}</button><button className={styles.harvestButton} type="button" aria-label="Open polygon history" onClick={() => { setHistoryTab("history"); setModal("history"); }}><span /><span /><span /><span /></button></div>
        </main>
      </section>

      {sidebarOpen && <><button className={styles.sidebarScrim} type="button" aria-label="Close field console menu" onClick={() => setSidebarOpen(false)} /><aside className={styles.sidebar} aria-label="Field console menu">
        <div className={styles.sidebarHeader}><div><small>SYMMETRY / FIELD OPS</small><strong>CONTROL MENU</strong></div><button type="button" aria-label="Close menu" onClick={() => setSidebarOpen(false)}><CloseIcon /></button></div>
        <nav className={styles.sidebarNav}><button type="button" className={styles.sidebarNavActive}>EUDR SERVER <span>LIVE</span></button><button type="button" onClick={() => { setSidebarOpen(false); setHistoryTab("history"); setSelectedRecord(null); setModal("history"); }}>POLYGON HISTORY <span>{records.length}</span></button><button type="button" onClick={() => { setSidebarOpen(false); setHistoryTab("inputs"); setSelectedRecord(null); setModal("history"); }}>PRODUCT INPUTS <span>{records.length}</span></button></nav>
        <div className={styles.sidebarStatus}><small>ACTIVE LAYERS</small><strong>{activeLayers.length} / 5 SWITCHES ON</strong><span>Move the map under the blue GPS cursor to define each vertex.</span><button type="button" className={styles.sidebarSignOut} onClick={() => void signOut()}>SIGN OUT</button></div>
      </aside></>}

      {toast && <div className={styles.toast}><CheckIcon />{toast}</div>}

      {modal && <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
        {modal === "survey" && <form className={styles.modal} onSubmit={saveSurvey}>
          <div className={styles.modalHeader}><div><small>POLYGON CLOSED / EUDR</small><h2>Harvest <i>survey.</i></h2></div><button type="button" onClick={() => setModal(null)} aria-label="Close"><CloseIcon /></button></div>
          <p>Completa la información mínima para conectar la parcela con producción y exportación.</p>
          <label>Crop / product<input name="crop" required placeholder="Cacao" /></label>
          <div className={styles.formRow}><label>Harvest year<input name="harvestYear" required type="number" placeholder="2026" /></label><label>Volume<input name="volume" required placeholder="2.4 t" /></label></div>
          <label>Export destination<input name="destination" required placeholder="European Union" /></label>
          <label>Producer / cooperative<input name="producer" required placeholder="Association name" /></label>
          <div className={styles.modalActions}><button className={styles.cancelButton} type="button" onClick={() => setModal(null)}>SAVE LATER</button><button className={styles.saveButton} type="submit" disabled={saving}>{saving ? "SAVING..." : "SAVE SURVEY"} <ArrowRight /></button></div>
        </form>}

        {modal === "history" && <section className={`${styles.modal} ${styles.historyModal}`} aria-label="Polygon records">
          <div className={styles.modalHeader}><div><small>FIELD ARCHIVE / EUDR</small><h2>Polygon <i>records.</i></h2></div><button type="button" onClick={() => setModal(null)} aria-label="Close"><CloseIcon /></button></div>
          <p>Consulta parcelas rastreadas, entradas<br />de producto y mercados objetivo.</p>
          <div className={styles.historyPills} role="tablist" aria-label="Polygon archive sections">
            <button className={historyTab === "history" ? styles.historyPillActive : styles.historyPill} type="button" onClick={() => { setHistoryTab("history"); setSelectedRecord(null); }}>HISTORIAL</button>
            <button className={historyTab === "inputs" ? styles.historyPillActive : styles.historyPill} type="button" onClick={() => { setHistoryTab("inputs"); setSelectedRecord(null); }}>ENTRADAS</button>
            <button className={historyTab === "market" ? styles.historyPillActive : styles.historyPill} type="button" onClick={() => { setHistoryTab("market"); setSelectedRecord(null); }}>MERCADO</button>
          </div>
          {historyTab === "history" && <div className={styles.historyList}>{records.length === 0 ? <div className={styles.historyEmpty}>Aún no hay polígonos guardados.<br /><span>Cierra un polígono para crear el primer registro.</span></div> : records.slice().reverse().map((record) => <button className={styles.historyCard} type="button" key={record.id} onClick={() => setSelectedRecord(record)}><div><strong>{record.id}</strong><small>{record.crop || "PRODUCTO PENDIENTE"} · {record.points?.length || 0} VÉRTICES</small></div><b>{record.destination || "MERCADO PENDIENTE"}</b><time>{new Date(record.createdAt).toLocaleDateString("es-CO")}</time></button>)}</div>}
          {historyTab === "history" && selectedRecord && <div className={styles.passportOverlay}><div className={styles.passportCard}>
            <div className={styles.passportHeader}><div><small>LOT PASSPORT / EUDR</small><h3>{selectedRecord.id}</h3></div><button type="button" aria-label="Close lot passport" onClick={() => setSelectedRecord(null)}><CloseIcon /></button></div>
            <div className={styles.passportGrid} ref={passportGridRef} style={{ display: passportGridHeight ? "grid" : undefined, gridTemplateColumns: passportGridHeight ? "repeat(2, minmax(0, 1fr))" : undefined, gridTemplateRows: passportGridHeight ? "repeat(3, minmax(0, 1fr))" : undefined, height: passportGridHeight ? `${passportGridHeight}px` : undefined } as CSSProperties}><div><small>PRODUCT</small><strong>{(selectedRecord.crop || "—").toLocaleUpperCase()}</strong></div><div><small>HARVEST YEAR</small><strong>{selectedRecord.harvestYear || "—"}</strong></div><div><small>VOLUME</small><strong>{selectedRecord.volume || "—"}</strong></div><div><small>TARGET MARKET</small><strong>{selectedRecord.destination || "—"}</strong></div><div><small>PRODUCER</small><strong>{selectedRecord.producer || "—"}</strong></div><div><small>VERTICES</small><strong>{selectedRecord.points?.length || 0}</strong></div></div>
            <div className={styles.passportGeo}><small>GEOGRAPHIC FIX</small><strong>{selectedRecord.location ? `${Math.abs(selectedRecord.location.lat).toFixed(5)}° ${selectedRecord.location.lat >= 0 ? "N" : "S"} · ${Math.abs(selectedRecord.location.lon).toFixed(5)}° ${selectedRecord.location.lon >= 0 ? "E" : "W"}` : "GPS DATA PENDING"}</strong><span>{selectedRecord.accuracy ? `GPS ACCURACY ±${selectedRecord.accuracy}M` : "VERTEX CENTER CAPTURE"}</span></div>
            <div className={styles.passportVertices}><small>POLYGON VECTOR / VERTICES</small><div>{(selectedRecord.points || []).map((point, index) => <span key={`${point.lat}-${point.lon}`}>{String(index + 1).padStart(2, "0")} · {point.lat.toFixed(5)}, {point.lon.toFixed(5)}</span>)}</div></div>
            <time className={styles.passportDate}>RECORDED {new Date(selectedRecord.createdAt).toLocaleString("es-CO")}</time>
          </div></div>}
          {historyTab === "inputs" && <div className={styles.historyPanel}><strong>{productTypes.length || 0}</strong><span>tipos de producto registrados</span>{productTypes.length > 0 ? <div className={styles.historyTags}>{productTypes.map((product) => <em key={product}>{product}</em>)}</div> : <p>Las entradas aparecerán cuando completes la encuesta de cosecha.</p>}</div>}
          {historyTab === "market" && <div className={styles.historyPanel}><strong>{marketTypes.length || 0}</strong><span>mercados objetivo registrados</span>{marketTypes.length > 0 ? <div className={styles.historyTags}>{marketTypes.map((market) => <em key={market}>{market}</em>)}</div> : <p>Los mercados aparecerán cuando completes la encuesta de cosecha.</p>}</div>}
        </section>}
      </div>}
    </div>
  );
}


