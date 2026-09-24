"use client";

import { TAYRONA_AOI } from "@/lib/nature-layers";

const COPERNICUS_URL =
  "https://browser.dataspace.copernicus.eu/" +
  `?zoom=12&lat=${TAYRONA_AOI.center[1]}&lng=${TAYRONA_AOI.center[0]}` +
  "&themeId=DEFAULT-THEME&visualizationUrl=https%3A%2F%2Fsh.dataspace.copernicus.eu%2Fogc%2Fwms%2Fv1_3" +
  "&datasetId=S2_L2A_CDAS&fromTime=2024-01-01T00%3A00%3A00.000Z&toTime=2026-09-22T23%3A59%3A59.999Z" +
  "&layerId=3_NDVI&demSource3D=%22MAPZEN%22&cloudCoverage=30";

export function CopernicusEmbed({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="ni-viewer-shell ni-viewer-shell-stack">
      <aside className="ni-viewer-side">
        <p className="ni-viewer-kicker">Óptico · Sentinel-2</p>
        <h3>Deforestación & vegetación</h3>
        <p>
          Visor Copernicus Data Space Browser sobre el AOI piloto{" "}
          <strong>{TAYRONA_AOI.name}</strong>. NDVI y pérdida de vegetación alimentan
          alertas tipadas hacia EUDR.
        </p>
        <ul className="ni-side-list">
          <li>Fuente declarada: Copernicus / Sentinel-2</li>
          <li>Producto: NDVI / cambio de cobertura</li>
          <li>Contrato: observación → validación → evidencia</li>
        </ul>
        <a className="ni-external" href={COPERNICUS_URL} target="_blank" rel="noreferrer">
          Abrir en Copernicus ↗
        </a>
      </aside>
      <div className="ni-iframe-wrap">
        <iframe title="Copernicus Sentinel-2 NDVI" src={COPERNICUS_URL} loading="lazy" />
      </div>
    </div>
  );
}
