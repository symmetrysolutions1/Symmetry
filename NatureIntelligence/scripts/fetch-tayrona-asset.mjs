import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "NatureIntelligence");
const assetsDir = resolve(root, "assets");
const sourceUrl =
  "https://mapas.parquesnacionales.gov.co/arcgis/rest/services/pnn/Limites_oficiales_Poligono/FeatureServer/0/query?where=ap_nombre%3D%27Tayrona%27&outFields=*&returnGeometry=true&outSR=4326&f=geojson";

const response = await fetch(sourceUrl, {
  headers: { accept: "application/geo+json, application/json" },
});
if (!response.ok) {
  throw new Error(`Parques Nacionales respondió HTTP ${response.status}`);
}

const featureCollection = await response.json();
if (featureCollection?.type !== "FeatureCollection" || !featureCollection.features?.length) {
  throw new Error("La respuesta no contiene un FeatureCollection con Tayrona.");
}

const feature = featureCollection.features.find((item) => {
  const name = item?.properties?.ap_nombre ?? item?.properties?.AP_NOMBRE;
  return typeof name === "string" && name.trim().toLowerCase() === "tayrona";
});
if (!feature?.geometry) {
  throw new Error("No se encontró la geometría oficial de Tayrona.");
}
if (!['Polygon', 'MultiPolygon'].includes(feature.geometry.type)) {
  throw new Error(`Geometría no soportada: ${feature.geometry.type}`);
}

const geometry = JSON.stringify(feature.geometry);
const geometryDigest = `0x${createHash("sha256").update(geometry).digest("hex")}`;
const asset = {
  assetRef: "CO-TAYRONA-PNN-001",
  name: "Parque Nacional Natural Tayrona",
  sourceUrl,
  authority: "Parques Nacionales Naturales de Colombia",
  coordinateReferenceSystem: "EPSG:4326",
  geometryType: feature.geometry.type,
  geometryDigest,
  geometryFile: "./tayrona.geojson",
  retrievedAt: new Date().toISOString(),
};

await mkdir(assetsDir, { recursive: true });
await writeFile(
  resolve(assetsDir, "tayrona.geojson"),
  `${JSON.stringify({ type: "FeatureCollection", features: [feature] }, null, 2)}\n`,
  "utf8",
);
await writeFile(resolve(assetsDir, "tayrona.asset.json"), `${JSON.stringify(asset, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  status: "written",
  assetRef: asset.assetRef,
  geometryType: asset.geometryType,
  geometryDigest: asset.geometryDigest,
  geometryFile: "NatureIntelligence/assets/tayrona.geojson",
}, null, 2));
