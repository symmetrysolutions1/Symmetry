export type NatureLayerId =
  | "fire"
  | "deforestation"
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
    title: "Fire Risk alert",
    subtitle: "Señales térmicas para priorizar la verificación territorial",
    sensors: ["GOES-East", "VIIRS", "MODIS", "NASA FIRMS"],
    latency: "Observación térmica",
    status: "live",
    accent: "#ff3b2f",
    summary:
      "Visualiza focos térmicos y la capa de riesgo sobre el área de consulta. Estas señales ayudan a priorizar una revisión; por sí solas no confirman un incendio.",
    bullets: [
      "GOES, VIIRS y MODIS en capas independientes",
      "Temperatura superficial y focos visibles en el visor",
      "La alerta orienta la decisión; requiere verificación humana",
    ],
  },
  {
    id: "deforestation",
    index: "02",
    title: "Deforestation Lines",
    subtitle: "Parques nacionales definidos para la preservación del territorio",
    sensors: ["Parques nacionales", "Áreas protegidas", "Preservación"],
    latency: "Esquema de capa",
    status: "pilot",
    accent: "#d7ff5f",
    summary:
      "Esta vista organizará los parques nacionales definidos para preservación. Por ahora es un esquema de diseño: aún falta integrar y validar las geometrías oficiales de las áreas protegidas.",
    bullets: [
      "Enfoque de esta capa: parques nacionales y sus límites de preservación",
      "Las geometrías oficiales y la fuente institucional quedan por definir e integrar",
      "Los contornos mostrados son esquemáticos; no representan parques reales",
    ],
  },
  {
    id: "water",
    index: "03",
    title: "WaterFlow",
    subtitle: "Ríos terrestres y corredores de humedad atmosférica",
    sensors: ["Ríos superficiales", "Ríos atmosféricos"],
    latency: "En exploración",
    status: "roadmap",
    accent: "#38bdf8",
    summary:
      "Un esquema de lectura hidrológica con visores seleccionables para ríos terrestres y cuerpos de agua, más un control independiente para mostrar ríos atmosféricos. La integración de fuentes y datos reales queda pendiente.",
    bullets: [
      "Activa o desactiva las capas terrestres desde sus casillas",
      "El botón Ríos atmosféricos muestra u oculta esa lectura conceptual",
      "Geometrías y fuentes reales aún por definir; la vista es esquemática",
    ],
  },
];
