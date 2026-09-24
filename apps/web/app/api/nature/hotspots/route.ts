import { NextResponse } from "next/server";
import sample from "@/lib/sample-hotspots.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AOI = {
  name: "Santiago de Cali",
  west: -76.85,
  south: 3.2,
  east: -76.35,
  north: 3.7,
};

type Hotspot = {
  source: string;
  lat: number;
  lon: number;
  bright?: number | null;
  frp?: number | null;
  acq_date?: string | null;
  acq_time?: string | null;
  confidence?: string | number | null;
  label?: string;
  demo?: boolean;
  note?: string;
};

function inAoi(lat: number, lon: number) {
  return AOI.south <= lat && lat <= AOI.north && AOI.west <= lon && lon <= AOI.east;
}

function toFeature(h: Hotspot, demo: boolean) {
  const src = String(h.source || "demo").toLowerCase();
  return {
    type: "Feature" as const,
    geometry: { type: "Point" as const, coordinates: [h.lon, h.lat] },
    properties: {
      source: src,
      bright: h.bright ?? null,
      frp: h.frp ?? null,
      acq_date: h.acq_date ?? null,
      acq_time: h.acq_time ?? null,
      confidence: h.confidence ?? null,
      label: h.label ?? null,
      demo,
      note: h.note ?? (demo ? "datos de demostración — no son incendios reales" : null),
      score: src === "goes" ? "WATCH" : src === "viirs" ? "CONFIRM" : "CONFIRM",
    },
  };
}

function demoCollection() {
  const hotspots = (sample as { hotspots: Hotspot[] }).hotspots || [];
  const features = hotspots.map((h) => toFeature(h, true));
  const counts = { goes: 0, viirs: 0, modis: 0, demo: features.length };
  for (const f of features) {
    const s = String(f.properties.source);
    if (s in counts) (counts as Record<string, number>)[s] += 1;
  }
  return {
    type: "FeatureCollection",
    features,
    meta: {
      mode: "demo",
      aoi: AOI,
      last_refresh: new Date().toISOString(),
      counts,
      warning: "datos de demostración — no son incendios reales",
    },
  };
}

async function fetchFirms(mapKey: string, source: string, dayRange: number, date?: string): Promise<Hotspot[]> {
  const bbox = `${AOI.west},${AOI.south},${AOI.east},${AOI.north}`;
  const datePath = date ? `/${date}` : "";
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/${source}/${bbox}/${dayRange}${datePath}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`FIRMS ${source} HTTP ${res.status}`);
  const text = await res.text();
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0].split(",");
  const idx = Object.fromEntries(header.map((h, i) => [h.trim().toLowerCase(), i]));
  const out: Hotspot[] = [];
  for (const line of lines.slice(1)) {
    const cols = line.split(",");
    const lat = Number(cols[idx.latitude ?? idx.lat]);
    const lon = Number(cols[idx.longitude ?? idx.lon]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !inAoi(lat, lon)) continue;
    out.push({
      source: source.toLowerCase().includes("goes")
        ? "goes"
        : source.toLowerCase().includes("modis")
          ? "modis"
          : "viirs",
      lat,
      lon,
      bright: Number(cols[idx.bright_ti4 ?? idx.brightness ?? idx.bright_ti5]) || null,
      frp: Number(cols[idx.frp]) || null,
      acq_date: cols[idx.acq_date] || null,
      acq_time: cols[idx.acq_time] || null,
      confidence: cols[idx.confidence] || null,
      demo: false,
    });
  }
  return out;
}

function validQueryDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value && value <= new Date().toISOString().slice(0, 10);
}

async function fetchHistoricalSource(mapKey: string, sources: string[], date: string) {
  let lastError: unknown;
  for (const source of sources) {
    try {
      return await fetchFirms(mapKey, source, 1, date);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error("No hay un producto FIRMS disponible para esta fecha");
}

export async function GET(request: Request) {
  const requestedDate = new URL(request.url).searchParams.get("date");
  if (requestedDate && !validQueryDate(requestedDate)) {
    return NextResponse.json({ error: "Fecha no válida o posterior a hoy" }, { status: 400 });
  }
  const mapKey = process.env.FIRMS_MAP_KEY?.trim();
  if (requestedDate && !mapKey) {
    return NextResponse.json({ error: "La consulta histórica requiere configurar FIRMS_MAP_KEY en el servidor" }, { status: 503 });
  }
  if (!mapKey) {
    return NextResponse.json(demoCollection());
  }

  if (requestedDate) {
    const requests: Array<[string, string[]]> = [
      ["GOES", ["GOES_NRT"]],
      ["VIIRS S-NPP", ["VIIRS_SNPP_NRT", "VIIRS_SNPP_SP"]],
      ["VIIRS NOAA-20", ["VIIRS_NOAA20_NRT", "VIIRS_NOAA20_SP"]],
      ["VIIRS NOAA-21", ["VIIRS_NOAA21_NRT"]],
      ["MODIS", ["MODIS_NRT", "MODIS_SP"]],
    ];
    const results = await Promise.allSettled(requests.map(([, sources]) => fetchHistoricalSource(mapKey, sources, requestedDate)));
    const features = results.flatMap((result) => result.status === "fulfilled" ? result.value.map((hotspot) => toFeature(hotspot, false)) : []);
    const failedSources = results.filter((result) => result.status === "rejected").length;
    const counts = { goes: 0, viirs: 0, modis: 0, demo: 0 };
    for (const feature of features) {
      const source = String(feature.properties.source);
      if (source === "goes" || source === "viirs" || source === "modis") counts[source] += 1;
    }
    return NextResponse.json({
      type: "FeatureCollection",
      features,
      meta: {
        mode: "historical",
        selected_date: requestedDate,
        aoi: AOI,
        last_refresh: new Date().toISOString(),
        counts,
        warning: failedSources ? `${failedSources} fuente(s) FIRMS no estaban disponibles para esa fecha` : features.length ? null : "No se encontraron focos en las fuentes consultadas para esa fecha",
      },
    });
  }

  try {
    const [goes, viirsSnpp, viirsN20, viirsN21, modis] = await Promise.all([
      fetchFirms(mapKey, "GOES_NRT", 2),
      fetchFirms(mapKey, "VIIRS_SNPP_NRT", 3),
      fetchFirms(mapKey, "VIIRS_NOAA20_NRT", 3),
      fetchFirms(mapKey, "VIIRS_NOAA21_NRT", 3),
      fetchFirms(mapKey, "MODIS_NRT", 3),
    ]);
    const all = [...goes, ...viirsSnpp, ...viirsN20, ...viirsN21, ...modis];
    const features = all.map((h) => toFeature(h, false));
    const counts = { goes: 0, viirs: 0, modis: 0, demo: 0 };
    for (const f of features) {
      const s = String(f.properties.source);
      if (s === "goes") counts.goes += 1;
      else if (s === "viirs") counts.viirs += 1;
      else if (s === "modis") counts.modis += 1;
    }
    return NextResponse.json({
      type: "FeatureCollection",
      features,
      meta: {
        mode: "live",
        aoi: AOI,
        last_refresh: new Date().toISOString(),
        counts,
        warning: null,
      },
    });
  } catch {
    const demo = demoCollection();
    demo.meta.warning = "FIRMS no disponible — mostrando demo";
    return NextResponse.json(demo);
  }
}
