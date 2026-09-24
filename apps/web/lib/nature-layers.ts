export type NatureLayerId =
  | "fire"
  | "deforestation"
  | "territory"
  | "alerts"
  | "evidence"
  | "water";

export type NatureLayer = {
  id: NatureLayerId;
  index: string;
  title: string;
  subtitle: string;
  sensors: string[];
  latency: string;
  status: "live" | "pilot" | "roadmap";
  accent: string;
  summary: string;
  bullets: string[];
};

export const CALI_AOI = {
  name: "Santiago de Cali",
  west: -76.85,
  south: 3.2,
  east: -76.35,
  north: 3.7,
  center: [-76.53, 3.45] as [number, number],
};

export const TAYRONA_AOI = {
  name: "PNN Tayrona (piloto óptico)",
  west: -74.2,
  south: 11.25,
  east: -73.85,
  north: 11.4,
  center: [-74.03, 11.32] as [number, number],
};

export const natureLayers: NatureLayer[] = [
  {
    id: "fire",
    index: "01",
    title: "Señales térmicas y focos de calor",
    subtitle: "Observación satelital para orientar una revisión temprana",
    sensors: ["GOES-East", "VIIRS", "MODIS"],
    latency: "GOES: minutos · VIIRS / MODIS: horas",
    status: "live",
    accent: "#ff3b2f",
    summary:
      "Consulta focos térmicos de NASA FIRMS sobre el área de Cali. La señal ayuda a priorizar una revisión; por sí sola no confirma un incendio.",
    bullets: [
      "Fuentes GOES, VIIRS y MODIS por separado",
      "Señales orientativas con nivel de atención",
      "Revisión humana antes de registrar una respuesta",
    ],
  },
  {
    id: "deforestation",
    index: "02",
    title: "Vegetación y cambio de cobertura",
    subtitle: "Imágenes ópticas Sentinel-2 para dar contexto al territorio",
    sensors: ["Sentinel-2", "Copernicus"],
    latency: "Revisita óptica: varios días",
    status: "pilot",
    accent: "#d7ff5f",
    summary:
      "Explora indicadores de vegetación y cambios de cobertura en una experiencia piloto con imágenes Sentinel-2 y Copernicus.",
    bullets: [
      "Contexto óptico para el análisis del territorio",
      "Piloto geográfico en Tayrona",
      "Puente de evidencia hacia la debida diligencia EUDR",
    ],
  },
  {
    id: "territory",
    index: "03",
    title: "Territorios bajo monitoreo",
    subtitle: "Áreas de interés con geometría y responsables definidos",
    sensors: ["GeoJSON", "Workspace Nature"],
    latency: "Alcance según territorio registrado",
    status: "pilot",
    accent: "#7dd3a0",
    summary:
      "Define el área que da contexto a cada observación y quién está autorizado para revisar sus señales.",
    bullets: [
      "Geometrías del territorio de interés",
      "Responsables y contexto de revisión",
      "Alcance espacial para las capas conectadas",
    ],
  },
  {
    id: "alerts",
    index: "04",
    title: "Alertas con revisión humana",
    subtitle: "Una cola de señales para revisar, validar o descartar",
    sensors: ["fire_signal", "ndvi_drop", "vegetation_loss"],
    latency: "Según eventos recibidos",
    status: "pilot",
    accent: "#ff9f43",
    summary:
      "Reúne señales de distintas capas para que un operador documente su revisión y el siguiente paso.",
    bullets: [
      "Nivel de atención y motivo de la señal",
      "Validación o descarte con actor y nota",
      "Decisiones enlazadas a su evidencia",
    ],
  },
  {
    id: "evidence",
    index: "05",
    title: "Pasaportes de evidencia",
    subtitle: "El registro del origen, método y revisión de cada observación",
    sensors: ["HSK", "hashes", "Base Sepolia"],
    latency: "Anclaje sujeto a configuración",
    status: "pilot",
    accent: "#a8d8ff",
    summary:
      "Organiza los metadatos y decisiones que permiten reconstruir cómo se obtuvo y revisó una observación.",
    bullets: [
      "Fuente, método y resumen verificable",
      "Historial de revisión reconstruible",
      "Datos sensibles fuera de la cadena",
    ],
  },
  {
    id: "water",
    index: "06",
    title: "Agua e hidrología",
    subtitle: "Una futura lectura de cambios hídricos territoriales",
    sensors: ["Sentinel-2 SWIR", "roadmap"],
    latency: "En exploración",
    status: "roadmap",
    accent: "#38bdf8",
    summary:
      "Una línea prevista para explorar cambios hídricos con fuentes satelitales dentro del mismo flujo territorial.",
    bullets: [
      "Diseño de señales hídricas",
      "Integración futura con revisión territorial",
      "Disponibilidad sujeta a desarrollo",
    ],
  },
];
