"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Brand } from "@/components/brand";
import { ArrowRight, CheckIcon, CloseIcon } from "@/components/icons";
import { loadMapLibre, type MapLibreMap } from "@/components/nature-viewers/fire-map";
import styles from "./server-console.module.css";

type Modal = "survey" | "history" | null;
type HistoryTab = "history" | "inputs" | "market";
type Layer = "thermal" | "ice" | "magnetic" | "topo" | "radar";
type ColombiaMunicipality = {
  departmentCode: string;
  municipalityCode: string;
  municipality: string;
  category: string;
};
type ParcelRecord = {
  id: string;
  createdAt: string;
  points: Array<{ lat: number; lon: number }>;
  location: { lat?: number; lon?: number; city?: string; region?: string; country?: string; label?: string; farmName?: string; departmentCode?: string; municipalityCode?: string } | null;
  locationCity: string;
  locationRegion: string;
  locationCountry: string;
  locationLabel: string;
  accuracy: number | null;
  crop: string;
  farmName: string;
  harvestYear: string;
  volume: string;
  destination: string;
  producer: string;
  layer?: Layer;
};
type UserProfile = {
  fullName: string;
  contactEmail: string;
  organization: string;
  preferredLanguage: "es" | "en";
};
const colombiaDepartments = [
  { code: "05", name: "Antioquia" }, { code: "08", name: "Atlántico" }, { code: "11", name: "Bogotá, D.C." },
  { code: "13", name: "Bolívar" }, { code: "15", name: "Boyacá" }, { code: "17", name: "Caldas" },
  { code: "18", name: "Caquetá" }, { code: "19", name: "Cauca" }, { code: "20", name: "Cesar" },
  { code: "23", name: "Córdoba" }, { code: "25", name: "Cundinamarca" }, { code: "27", name: "Chocó" },
  { code: "41", name: "Huila" }, { code: "44", name: "La Guajira" }, { code: "47", name: "Magdalena" },
  { code: "50", name: "Meta" }, { code: "52", name: "Nariño" }, { code: "54", name: "Norte de Santander" },
  { code: "63", name: "Quindío" }, { code: "66", name: "Risaralda" }, { code: "68", name: "Santander" },
  { code: "70", name: "Sucre" }, { code: "73", name: "Tolima" }, { code: "76", name: "Valle del Cauca" },
  { code: "81", name: "Arauca" }, { code: "85", name: "Casanare" }, { code: "86", name: "Putumayo" },
  { code: "88", name: "Archipiélago de San Andrés, Providencia y Santa Catalina" }, { code: "91", name: "Amazonas" },
  { code: "94", name: "Guainía" }, { code: "95", name: "Guaviare" }, { code: "97", name: "Vaupés" }, { code: "99", name: "Vichada" },
];

const emptyProfile: UserProfile = {
  fullName: "",
  contactEmail: "",
  organization: "",
  preferredLanguage: "es",
};
const layerLabels: Record<Layer, string> = {
  thermal: "SIEMBRA 1",
  ice: "SIEMBRA 2",
  magnetic: "SIEMBRA 3",
  topo: "SIEMBRA 4",
  radar: "SIEMBRA 5",
};

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
  const [mapCenter, setMapCenter] = useState({ lat: 4.65, lon: -74.08 });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(emptyProfile);
  const [savedProfile, setSavedProfile] = useState<UserProfile>(emptyProfile);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const layersStripRef = useRef<HTMLDivElement>(null);
  const layerDragRef = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });
  const supabase = useMemo(() => createClient(), []);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState(() => supabase ? "" : "Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  const [saving, setSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"offline" | "connecting" | "online" | "degraded">(() => supabase ? "connecting" : "offline");
  const [surveyStep, setSurveyStep] = useState<1 | 2>(1);
  const [colombiaMunicipalities, setColombiaMunicipalities] = useState<ColombiaMunicipality[]>([]);
  const [municipalitiesLoading, setMunicipalitiesLoading] = useState(true);
  const [municipalitiesError, setMunicipalitiesError] = useState("");
  const [selectedDepartmentCode, setSelectedDepartmentCode] = useState("");
  const [selectedMunicipalityCode, setSelectedMunicipalityCode] = useState("");
  const municipalitiesForDepartment = useMemo(() => colombiaMunicipalities
    .filter((municipality) => municipality.departmentCode === selectedDepartmentCode)
    .sort((a, b) => a.municipality.localeCompare(b.municipality, "es")), [colombiaMunicipalities, selectedDepartmentCode]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({
      "$select": "cod_dpto,cod_mpio,nom_mpio,tipo_municipio",
      "$limit": "5000",
      "$order": "cod_dpto,nom_mpio",
    });
    fetch(`https://www.datos.gov.co/resource/gdxc-w37w.json?${params}`, { cache: "force-cache" })
      .then(async (response) => {
        if (!response.ok) throw new Error("DIVIPOLA request failed");
        return await response.json() as Array<Record<string, unknown>>;
      })
      .then((rows) => {
        if (!active) return;
        const normalized = rows.flatMap((row) => {
          const departmentCode = String(row.cod_dpto ?? "").trim().padStart(2, "0");
          const municipalityCode = String(row.cod_mpio ?? "").trim().padStart(5, "0");
          const municipality = String(row.nom_mpio ?? "").trim();
          if (!departmentCode || !municipalityCode || !municipality) return [];
          return [{ departmentCode, municipalityCode, municipality, category: String(row.tipo_municipio ?? "Municipio").trim() }];
        });
        if (normalized.length === 0) throw new Error("DIVIPOLA returned no municipalities");
        setColombiaMunicipalities(normalized);
        setMunicipalitiesError("");
      })
      .catch(() => {
        if (active) setMunicipalitiesError("No cargó el catálogo DIVIPOLA. Puedes escribir el municipio manualmente.");
      })
      .finally(() => {
        if (active) setMunicipalitiesLoading(false);
      });
    return () => { active = false; };
  }, []);

  const loadRecords = useCallback(async (userId: string) => {
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

    const normalized = (data ?? []).map((row) => {
      const location = row.location && typeof row.location === "object"
        ? row.location as ParcelRecord["location"]
        : null;
      return {
        id: String(row.id),
        createdAt: String(row.created_at),
        points: Array.isArray(row.points) ? row.points as Array<{ lat: number; lon: number }> : [],
        location,
        locationCity: String(location?.city ?? ""),
        locationRegion: String(location?.region ?? ""),
        locationCountry: String(location?.country ?? ""),
        locationLabel: String(location?.label ?? ""),
        farmName: String(location?.farmName ?? ""),
        accuracy: typeof row.accuracy_m === "number" ? row.accuracy_m : null,
        crop: String(row.crop ?? ""),
        harvestYear: row.harvest_year == null ? "" : String(row.harvest_year),
        volume: String(row.volume ?? ""),
        destination: String(row.destination ?? ""),
        producer: String(row.producer ?? ""),
        layer: row.layer as Layer | undefined,
      };
    }) as ParcelRecord[];

    setRecords(normalized);
    setSyncStatus("online");
    const latest = normalized[0];
    if (!latest) return;
    setPoints(latest.points);
    const latestCoordinates = latest.location && typeof latest.location.lat === "number" && typeof latest.location.lon === "number"
      ? { lat: latest.location.lat, lon: latest.location.lon }
      : null;
    setUserLocation(latestCoordinates);
    setGpsLocation(latestCoordinates);
    setAccuracy(latest.accuracy);
    setScanStatus("idle");
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let cancelled = false;
    const restoreSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      setAuthUser(data.user ?? null);
      setProfileLoading(Boolean(data.user));
      setProfileError("");
      setAuthLoading(false);
      if (data.user) void loadRecords(data.user.id);
    };

    void restoreSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setAuthUser(session?.user ?? null);
      setProfileLoading(Boolean(session?.user));
      setProfileError("");
      setAuthLoading(false);
      if (session?.user) window.setTimeout(() => void loadRecords(session.user.id), 0);
      else {
        setRecords([]);
        setSyncStatus("offline");
        setProfile(emptyProfile);
        setSavedProfile(emptyProfile);
      }
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [loadRecords, supabase]);

  useEffect(() => {
    if (!authUser || !supabase) {
      return;
    }

    let cancelled = false;
    void supabase
      .from("user_profiles")
      .select("full_name, contact_email, organization, preferred_language")
      .eq("user_id", authUser.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setProfileError("No fue posible cargar tu perfil.");
          setProfileLoading(false);
          return;
        }
        const nextProfile = data ? {
          fullName: String(data.full_name ?? ""),
          contactEmail: String(data.contact_email ?? ""),
          organization: String(data.organization ?? ""),
          preferredLanguage: data.preferred_language === "en" ? "en" : "es",
        } as UserProfile : emptyProfile;
        setProfile(nextProfile);
        setSavedProfile(nextProfile);
        setProfileError("");
        setProfileLoading(false);
      });

    return () => { cancelled = true; };
  }, [authUser, supabase]);

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
    if (!authUser || !mapElementRef.current || mapRef.current) return;
    let cancelled = false;
    let instance: MapLibreMap | null = null;
    let resizeObserver: ResizeObserver | null = null;
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
        });
        instance = map;
        resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => map.resize());
        resizeObserver?.observe(mapElementRef.current);
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
      resizeObserver?.disconnect();
      instance?.remove();
      mapRef.current = null;
    };
  }, [authUser]);

  useEffect(() => {
    const source = mapRef.current?.getSource("server-polygon") as import("maplibre-gl").GeoJSONSource | undefined;
    if (!source) return;
    if (scanStatus === "idle") {
      source.setData({ type: "FeatureCollection", features: [] });
      return;
    }
    const coordinates = points.map((point): [number, number] => [point.lon, point.lat]);
    const features: GeoJSON.Feature[] = coordinates.map((coordinate, index) => ({
      type: "Feature",
      properties: { vertex: index + 1 },
      geometry: { type: "Point", coordinates: coordinate },
    }));
    if (coordinates.length >= 2) {
      if (scanStatus === "closed" && coordinates.length >= 3) {
        features.unshift({
          type: "Feature",
          properties: { closed: true },
          geometry: { type: "Polygon", coordinates: [[...coordinates, coordinates[0]]] },
        });
      } else {
        features.unshift({
          type: "Feature",
          properties: { closed: false },
          geometry: { type: "LineString", coordinates },
        });
      }
    }
    source.setData({ type: "FeatureCollection", features });
  }, [mapReady, points, scanStatus]);

  useEffect(() => {
    const source = mapRef.current?.getSource("server-archives") as import("maplibre-gl").GeoJSONSource | undefined;
    if (!source) return;
    const layerKeys = Object.keys(layerLabels) as Layer[];
    const features: GeoJSON.Feature[] = records.flatMap((record, index) => {
      const ring = record.points.length >= 3
        ? [...record.points, record.points[0]].map((point): [number, number] => [point.lon, point.lat])
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
    setSurveyStep(1);
    setSelectedDepartmentCode("");
    setSelectedMunicipalityCode("");
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

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !authUser) return;
    setProfileSaving(true);
    setProfileMessage("");
    setProfileError("");
    const formData = new FormData(event.currentTarget);
    const nextProfile: UserProfile = {
      fullName: String(formData.get("fullName") || "").trim(),
      contactEmail: String(formData.get("contactEmail") || "").trim().toLowerCase(),
      organization: String(formData.get("organization") || "").trim(),
      preferredLanguage: formData.get("preferredLanguage") === "en" ? "en" : "es",
    };
    const { error } = await supabase.from("user_profiles").upsert({
      user_id: authUser.id,
      full_name: nextProfile.fullName,
      contact_email: nextProfile.contactEmail,
      organization: nextProfile.organization || null,
      preferred_language: nextProfile.preferredLanguage,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    setProfileSaving(false);
    if (error) {
      setProfileError("No fue posible guardar el perfil. Revisa los datos e inténtalo de nuevo.");
      return;
    }
    setProfile(nextProfile);
    setSavedProfile(nextProfile);
    setProfileMessage("Cambios guardados.");
  };

  const closeProfile = () => {
    setProfile(savedProfile);
    setProfileError("");
    setProfileMessage("");
    setProfileOpen(false);
  };

  const saveSurvey = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (surveyStep === 1) {
      const form = event.currentTarget;
      if (form.reportValidity()) {
        setSurveyStep(2);
        form.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    if (!supabase || !authUser) {
      announce("Inicia sesión antes de guardar una parcela");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const departmentCode = String(formData.get("locationDepartmentCode") || "");
    const department = colombiaDepartments.find((item) => item.code === departmentCode);
    const municipalityCode = String(formData.get("locationMunicipalityCode") || "");
    const municipality = colombiaMunicipalities.find((item) => item.municipalityCode === municipalityCode);
    const manualCity = municipality?.municipality || String(formData.get("locationCityManual") || "").trim();
    const manualRegion = department?.name || "";
    const manualCountry = formData.get("locationCountry") === "CO" ? "Colombia" : "";
    const farmName = String(formData.get("farmName") || "").trim();
    if (!manualCity || !manualRegion || !manualCountry || !farmName) {
      announce("Completa finca, país, departamento y municipio antes de guardar");
      return;
    }

    setSaving(true);
    const vertexCenter = points.length > 0 ? {
      lat: points.reduce((sum, point) => sum + point.lat, 0) / points.length,
      lon: points.reduce((sum, point) => sum + point.lon, 0) / points.length,
    } : null;
    const parcelLocation = gpsLocation || userLocation || vertexCenter;
    const locationLabel = [manualCity, manualRegion, manualCountry].filter(Boolean).join(", ");
    const location: ParcelRecord["location"] = {
      ...(parcelLocation ?? {}),
      city: manualCity,
      region: manualRegion,
      country: manualCountry,
      label: locationLabel,
      farmName,
      departmentCode,
      municipalityCode,
    };
    const record: ParcelRecord = {
      id: productPrefix(String(formData.get("crop") || "NA")) + "-" + Date.now().toString(36).toUpperCase(),
      createdAt: new Date().toISOString(),
      points,
      location,
      locationCity: manualCity,
      locationRegion: manualRegion,
      locationCountry: manualCountry,
      locationLabel: location.label ?? "",
      accuracy,
      crop: String(formData.get("crop") || ""),
      farmName,
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
    announce("Terreno " + record.id + " guardado para " + (authUser.email ?? "tu cuenta") + (record.locationCity ? " · ubicación verificada" : " · ubicación administrativa pendiente"));
  };

  const latitude = mapCenter.lat;
  const longitude = mapCenter.lon;
  const surveyVertexCenter = points.length > 0 ? {
    lat: points.reduce((sum, point) => sum + point.lat, 0) / points.length,
    lon: points.reduce((sum, point) => sum + point.lon, 0) / points.length,
  } : null;
  const surveyPosition = gpsLocation || userLocation || surveyVertexCenter;
  const surveyPositionLabel = surveyPosition
    ? `${Math.abs(surveyPosition.lat).toFixed(5)}° ${surveyPosition.lat >= 0 ? "N" : "S"} · ${Math.abs(surveyPosition.lon).toFixed(5)}° ${surveyPosition.lon >= 0 ? "E" : "W"}`
    : "La posición se tomará del polígono guardado.";
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
            <div className={styles.authFooter}><span>AUTH</span><span>{syncStatus.toUpperCase()}</span></div>
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
            <div className={styles.authFooter}><span>ACCESO PRIVADO</span><span>AUTH</span></div>
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
        <div className={styles.sidebarHeader}><div className={styles.sidebarHeaderContent}><small>SYMMETRY / FIELD OPS</small><strong>CONTROL MENU</strong><button className={styles.profileToggle} type="button" aria-haspopup="dialog" onClick={() => { setProfileOpen(true); setProfileMessage(""); setProfileError(""); }}><span>MI PERFIL</span><span>↗</span></button></div><button type="button" aria-label="Close menu" onClick={() => setSidebarOpen(false)}><CloseIcon /></button></div>
        <nav className={styles.sidebarNav}><button type="button" className={styles.sidebarNavActive}>EUDR SERVER <span>LIVE</span></button><button type="button" onClick={() => { setSidebarOpen(false); setHistoryTab("history"); setSelectedRecord(null); setModal("history"); }}>POLYGON HISTORY <span>{records.length}</span></button><button type="button" onClick={() => { setSidebarOpen(false); setHistoryTab("inputs"); setSelectedRecord(null); setModal("history"); }}>PRODUCT INPUTS <span>{records.length}</span></button></nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.systemApps} aria-label="Symmetry services">
            <button type="button" className={`${styles.systemApp} ${styles.systemAppEudr}`} aria-label="Open EUDR" onClick={() => setSidebarOpen(false)}>
              <strong>EUDR</strong>
              <small>LIVE</small>
            </button>
            <button type="button" className={`${styles.systemApp} ${styles.systemAppNature}`} aria-label="Nature Intelligence unavailable" disabled>
              <strong>NATURE</strong>
              <small>LOCKED</small>
            </button>
            <button type="button" className={`${styles.systemApp} ${styles.systemAppOperations}`} aria-label="Operations unavailable" disabled>
              <strong>OPS</strong>
              <small>LOCKED</small>
            </button>
          </div>
          <button type="button" className={styles.sidebarSignOut} onClick={() => void signOut()}>SIGN OUT</button>
        </div>
      </aside>{profileOpen && <div className={styles.profileModalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeProfile(); }}>
        <section className={styles.profileModal} role="dialog" aria-modal="true" aria-labelledby="profile-title">
          <div className={styles.profileModalHeader}><div><small>ACCOUNT / FIELD OPS</small><h2 id="profile-title">Perfil de <i>usuario.</i></h2></div><button type="button" aria-label="Cerrar perfil" onClick={closeProfile}><CloseIcon /></button></div>
          <form className={styles.profileForm} onSubmit={saveProfile}>
            <p>Datos de contacto asociados a esta cuenta. El usuario de acceso no cambia.</p>
            <label>Nombre completo<input name="fullName" autoComplete="name" required maxLength={120} value={profile.fullName} onChange={(event) => setProfile((current) => ({ ...current, fullName: event.target.value }))} disabled={profileLoading || profileSaving} /></label>
            <label>Correo de contacto<input name="contactEmail" type="email" autoComplete="email" required maxLength={254} value={profile.contactEmail} onChange={(event) => setProfile((current) => ({ ...current, contactEmail: event.target.value }))} disabled={profileLoading || profileSaving} /></label>
            <label>Empresa / cooperativa<input name="organization" autoComplete="organization" maxLength={160} value={profile.organization} onChange={(event) => setProfile((current) => ({ ...current, organization: event.target.value }))} disabled={profileLoading || profileSaving} /></label>
            <label>Idioma preferido<select name="preferredLanguage" value={profile.preferredLanguage} onChange={(event) => setProfile((current) => ({ ...current, preferredLanguage: event.target.value === "en" ? "en" : "es" }))} disabled={profileLoading || profileSaving}><option value="es">Español</option><option value="en">English</option></select></label>
            {profileError && <p className={styles.profileError} role="alert">{profileError}</p>}
            {profileMessage && <p className={styles.profileMessage} role="status">{profileMessage}</p>}
            <button className={styles.profileSave} type="submit" disabled={profileLoading || profileSaving}>{profileLoading ? "CARGANDO…" : profileSaving ? "GUARDANDO…" : "GUARDAR CAMBIOS"}</button>
          </form>
        </section>
      </div>}</>}

      {toast && <div className={styles.toast}><CheckIcon />{toast}</div>}

      {modal && <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
        {modal === "survey" && <form className={`${styles.modal} ${styles.surveyModal}`} onSubmit={saveSurvey}>
          <div className={styles.modalHeader}><div><small>POLYGON CLOSED / SHEET {surveyStep} OF 2</small><h2>{surveyStep === 1 ? <>Harvest <i>details.</i></> : <>Farm <i>location.</i></>}</h2></div><button type="button" onClick={() => setModal(null)} aria-label="Close"><CloseIcon /></button></div>
          <p>{surveyStep === 1 ? "Completa los datos de producción y exportación." : "Indica dónde está la finca. La posición GPS viene del polígono que acabas de dibujar."}</p>
          <div className={styles.surveyStep} hidden={surveyStep !== 1}>
            <label>Crop / product<input name="crop" required={surveyStep === 1} placeholder="Cacao" /></label>
            <div className={styles.formRow}><label>Harvest year<input name="harvestYear" required={surveyStep === 1} type="number" placeholder="2026" /></label><label>Volume<input name="volume" required={surveyStep === 1} placeholder="2.4 t" /></label></div>
            <label>Export destination<input name="destination" required={surveyStep === 1} placeholder="European Union" /></label>
            <label>Producer / cooperative<input name="producer" required={surveyStep === 1} placeholder="Association name" /></label>
            <div className={styles.modalActions}><button className={styles.cancelButton} type="button" onClick={() => setModal(null)}>SAVE LATER</button><button className={styles.saveButton} type="submit">ACCEPT / CONTINUE <ArrowRight /></button></div>
          </div>
          <div className={styles.surveyStep} hidden={surveyStep !== 2}>
            <label>Farm / estate name<input name="farmName" required={surveyStep === 2} placeholder="Finca El Roble" /></label>
            <div className={styles.locationPosition}><small>GPS / POLYGON POSITION</small><strong>{surveyPositionLabel}</strong></div>
            <label>Country<select name="locationCountry" defaultValue="CO" required={surveyStep === 2}><option value="CO">Colombia</option></select></label>
            <label>Department<select name="locationDepartmentCode" value={selectedDepartmentCode} required={surveyStep === 2} onChange={(event) => { setSelectedDepartmentCode(event.target.value); setSelectedMunicipalityCode(""); }}><option value="">Choose a department</option>{colombiaDepartments.map((department) => <option value={department.code} key={department.code}>{department.name}</option>)}</select></label>
            {municipalitiesError
              ? <label>City / municipality<input name="locationCityManual" required={surveyStep === 2} placeholder="Write the municipality name" /></label>
              : <label>City / municipality<select name="locationMunicipalityCode" value={selectedMunicipalityCode} required={surveyStep === 2} disabled={municipalitiesLoading || !selectedDepartmentCode} onChange={(event) => setSelectedMunicipalityCode(event.target.value)}><option value="">{municipalitiesLoading ? "Loading municipalities…" : selectedDepartmentCode ? "Choose a municipality" : "Choose a department first"}</option>{municipalitiesForDepartment.map((item) => <option value={item.municipalityCode} key={item.municipalityCode}>{item.municipality}{item.category && item.category.toLocaleLowerCase() !== "municipio" ? ` · ${item.category}` : ""}</option>)}</select></label>}
            {municipalitiesError && <p className={styles.locationListError} role="status">{municipalitiesError}</p>}
            <div className={styles.modalActions}><button className={styles.cancelButton} type="button" onClick={(event) => { setSurveyStep(1); event.currentTarget.form?.scrollTo({ top: 0, behavior: "smooth" }); }}>BACK TO HARVEST</button><button className={styles.saveButton} type="submit" disabled={saving}>{saving ? "SAVING..." : "SUBMIT / SAVE PARCEL"} <ArrowRight /></button></div>
          </div>
        </form>}

        {modal === "history" && <section className={`${styles.modal} ${styles.historyModal}`} aria-label="Polygon records">
          <div className={styles.modalHeader}><div><small>FIELD ARCHIVE / EUDR</small><h2>Polygon <i>records.</i></h2></div><button type="button" onClick={() => setModal(null)} aria-label="Close"><CloseIcon /></button></div>
          <p>Consulta parcelas rastreadas, entradas<br />de producto y mercados objetivo.</p>
          <div className={styles.historyPills} role="tablist" aria-label="Polygon archive sections">
            <button className={historyTab === "history" ? styles.historyPillActive : styles.historyPill} type="button" onClick={() => { setHistoryTab("history"); setSelectedRecord(null); }}>HISTORIAL</button>
            <button className={historyTab === "inputs" ? styles.historyPillActive : styles.historyPill} type="button" onClick={() => { setHistoryTab("inputs"); setSelectedRecord(null); }}>ENTRADAS</button>
            <button className={historyTab === "market" ? styles.historyPillActive : styles.historyPill} type="button" onClick={() => { setHistoryTab("market"); setSelectedRecord(null); }}>MERCADO</button>
          </div>
          {historyTab === "history" && <div className={styles.historyList}>{records.length === 0 ? <div className={styles.historyEmpty}>Aún no hay polígonos guardados.<br /><span>Cierra un polígono para crear el primer registro.</span></div> : records.map((record) => <button className={styles.historyCard} type="button" key={record.id} onClick={() => setSelectedRecord(record)}><div><strong>{record.id}</strong><small>{record.crop || "PRODUCTO PENDIENTE"} · {record.points?.length || 0} VÉRTICES</small></div><b>{record.destination || "MERCADO PENDIENTE"}</b><time>{new Date(record.createdAt).toLocaleDateString("es-CO")}</time></button>)}</div>}
          {historyTab === "history" && selectedRecord && <div className={styles.passportOverlay}><div className={styles.passportCard}>
            <div className={styles.passportHeader}><div><small>LOAD PASSPORT / EUDR</small><h3>{selectedRecord.id}</h3><p className={styles.passportLocationSubtitle}>{[[selectedRecord.farmName ? `FINCA ${selectedRecord.farmName.toLocaleUpperCase()}` : "", selectedRecord.crop ? selectedRecord.crop.toLocaleUpperCase() : ""].filter(Boolean).join(" | "), [selectedRecord.locationCity?.toLocaleUpperCase(), selectedRecord.locationRegion?.toLocaleUpperCase(), selectedRecord.locationCountry?.toLocaleUpperCase()].filter(Boolean).join(" · ")].filter(Boolean).join(" | ") || selectedRecord.locationLabel?.toLocaleUpperCase() || "UBICACIÓN POR RESOLVER"}</p></div><button type="button" aria-label="Close lot passport" onClick={() => setSelectedRecord(null)}><CloseIcon /></button></div>
            <div className={styles.passportGrid}><div><small>PRODUCT</small><strong>{(selectedRecord.crop || "—").toLocaleUpperCase()}</strong></div><div><small>HARVEST YEAR</small><strong>{selectedRecord.harvestYear || "—"}</strong></div><div><small>VOLUME</small><strong>{selectedRecord.volume || "—"}</strong></div><div><small>TARGET MARKET</small><strong>{selectedRecord.destination || "—"}</strong></div><div><small>PRODUCER</small><strong>{selectedRecord.producer || "—"}</strong></div><div><small>VERTICES</small><strong>{selectedRecord.points?.length || 0}</strong></div></div>
            <div className={styles.passportGeo}><small>GEOGRAPHIC FIX</small><strong>{selectedRecord.location && typeof selectedRecord.location.lat === "number" && typeof selectedRecord.location.lon === "number" ? <><b>{Math.abs(selectedRecord.location.lat).toFixed(5)}° {selectedRecord.location.lat >= 0 ? "N" : "S"}</b> · <b>{Math.abs(selectedRecord.location.lon).toFixed(5)}° {selectedRecord.location.lon >= 0 ? "E" : "W"}</b></> : "GPS DATA PENDING"}</strong><span>{selectedRecord.accuracy ? `GPS ACCURACY ±${selectedRecord.accuracy}M` : "VERTEX CENTER CAPTURE"}</span></div>
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


