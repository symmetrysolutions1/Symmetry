import Link from "next/link";

const copernicusTayronaUrl =
  "https://browser.dataspace.copernicus.eu/?zoom=10&lat=11.31465&lng=-74.05402&themeId=DEFAULT-THEME&visualizationUrl=U2FsdGVkX1%2Fi%2FibUJ3RMXvMEsjJXQZbmcxQ4KmGCaZTGtX7GY2nD7B4iYBIw7Yl7yA%2FAt5G09NWbWgBhQCOjAIdpHJK3ZMilBhlwqwXkgGHKuvCicDd3dJ%2BkWfCTNtUf&datasetId=S2_L2A_CDAS&fromTime=2026-09-20T00%3A00%3A00.000Z&toTime=2026-09-20T23%3A59%3A59.999Z&layerId=3_NDVI&cloudCoverage=30&dateMode=SINGLE";

export function NatureCopernicusViewer() {
  return (
    <section className="section nature-visor-section" id="copernicus-tayrona">
      <div className="shell">
        <div className="nature-visor-heading">
          <div>
            <span className="eyebrow">Fuente declarada / Sentinel-2</span>
            <h2>Parque Tayrona en observación.</h2>
          </div>
          <p>
            La escena se consulta en Copernicus Data Space y se interpreta sobre el
            polígono oficial del Parque Tayrona. La imagen es una señal; el asset y
            su evidencia conservan el contexto verificable.
          </p>
        </div>

        <div className="nature-visor-layout">
          <div className="nature-visor-frame">
            <div className="nature-visor-toolbar">
              <span>COPERNICUS DATASPACE / NDVI</span>
              <span>20 SEP 2026 · SENTINEL-2</span>
            </div>
            <div className="nature-visor-media">
              <div className="nature-visor-canvas">
                <div className="nature-visor-preview" aria-label="Previsualización del asset Parque Tayrona">
                  <span className="nature-preview-kicker">Previsualización del asset</span>
                  <strong>Parque Tayrona</strong>
                  <span className="nature-preview-polygon" aria-hidden="true" />
                  <small>Polígono oficial · WGS84</small>
                </div>
                <iframe
                  src={copernicusTayronaUrl}
                  title="Visor Copernicus Sentinel-2 del Parque Tayrona"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />
                <div className="nature-visor-fallback">
                  <span>Fuente externa / Sentinel-2</span>
                  <strong>Copernicus / NDVI</strong>
                  <small>
                    El Browser interactivo puede requerir una sesión propia. Abre la escena
                    completa para consultar sus capas y controles.
                  </small>
                  <Link href={copernicusTayronaUrl} target="_blank" rel="noreferrer">
                    Abrir visor Copernicus <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <aside className="nature-visor-asset">
            <span className="nature-card-label">Asset activo</span>
            <div className="nature-visor-map" aria-hidden="true">
              <span className="nature-map-orbit nature-map-orbit-one" />
              <span className="nature-map-orbit nature-map-orbit-two" />
              <span className="nature-map-polygon" />
              <span className="nature-map-point nature-map-point-one" />
              <span className="nature-map-point nature-map-point-two" />
              <span className="nature-map-point nature-map-point-three" />
            </div>
            <strong>CO-TAYRONA-PNN-001</strong>
            <p>Polígono oficial · Polygon / WGS84</p>
            <Link
              className="nature-inline-link"
              href="https://github.com/symmetrysolutions1/Symmetry/tree/main/NatureIntelligence/assets"
              target="_blank"
              rel="noreferrer"
            >
              Ver asset y digest <span aria-hidden="true">↗</span>
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
