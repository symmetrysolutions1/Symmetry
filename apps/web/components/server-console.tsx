"use client";

import { FormEvent, useEffect, useRef, useState, type PointerEvent } from "react";
import { ArrowRight, CheckIcon, CloseIcon } from "@/components/icons";
import styles from "./server-console.module.css";

type Modal = "survey" | "harvest" | null;
type Layer = "thermal" | "ice" | "magnetic" | "topo" | "radar";

const layerLabels: Record<Layer, string> = {
  thermal: "THERMAL",
  ice: "ICE_DEPTH",
  magnetic: "MAGNETIC",
  topo: "TOPO",
  radar: "RADAR",
};

export function ServerConsole() {
  const [activeLayers, setActiveLayers] = useState<Layer[]>(["thermal", "ice", "magnetic"]);
  const [modal, setModal] = useState<Modal>(null);
  const [toast, setToast] = useState("");
  const [points, setPoints] = useState<Array<{ lat: number; lon: number }>>([]);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "requesting" | "ready" | "denied">("idle");
  const [scanStatus, setScanStatus] = useState<"idle" | "capturing" | "closed">("idle");
  const layersStripRef = useRef<HTMLDivElement>(null);
  const layerDragRef = useRef({ active: false, startX: 0, scrollLeft: 0 });

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const saved = JSON.parse(window.localStorage.getItem("symmetry-eudr-parcels") || "[]") as Array<{
        points?: Array<{ lat: number; lon: number }>;
        location?: { lat: number; lon: number } | null;
        accuracy?: number | null;
      }>;
      const latest = saved[saved.length - 1];
      if (!latest) return;
      setPoints(latest.points || []);
      setUserLocation(latest.location || null);
      setAccuracy(latest.accuracy || null);
      setScanStatus("idle");
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, []);

  const announce = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  };

  const toggleLayer = (layer: Layer) => {
    setActiveLayers((current) => current.includes(layer) ? current.filter((item) => item !== layer) : [...current, layer]);
  };

  const startLayerDrag = (event: PointerEvent<HTMLDivElement>) => {
    const strip = layersStripRef.current;
    if (!strip) return;
    layerDragRef.current = { active: true, startX: event.clientX, scrollLeft: strip.scrollLeft };
    strip.setPointerCapture?.(event.pointerId);
  };

  const moveLayerDrag = (event: PointerEvent<HTMLDivElement>) => {
    const strip = layersStripRef.current;
    if (!strip || !layerDragRef.current.active) return;
    strip.scrollLeft = layerDragRef.current.scrollLeft - (event.clientX - layerDragRef.current.startX);
  };

  const endLayerDrag = (event?: PointerEvent<HTMLDivElement>) => {
    const strip = layersStripRef.current;
    if (event && strip?.hasPointerCapture?.(event.pointerId)) strip.releasePointerCapture(event.pointerId);
    layerDragRef.current.active = false;
  };

  const addPoint = (lat: number, lon: number, pointAccuracy: number | null) => {
    setPoints((current) => [...current, { lat, lon }]);
    setAccuracy(pointAccuracy);
    setUserLocation({ lat, lon });
  };

  const requestLocation = (fixVertex: boolean) => {
    setLocationStatus("requesting");
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      if (fixVertex) addPoint(2.8028 + points.length * 0.00008, -75 - points.length * 0.00006, null);
      setGpsBusy(false);
      announce("GPS no disponible en este navegador");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position = { lat: coords.latitude, lon: coords.longitude };
        setUserLocation(position);
        setAccuracy(Math.round(coords.accuracy));
        setLocationStatus("ready");
        if (fixVertex) setPoints((current) => [...current, position]);
        setGpsBusy(false);
        announce(fixVertex ? `Vértice ${points.length + 1} fijado desde GPS` : "Ubicación GPS enlazada al visor");
      },
      () => {
        setLocationStatus("denied");
        if (fixVertex) addPoint(2.8028 + points.length * 0.00008, -75 - points.length * 0.00006, null);
        setGpsBusy(false);
        announce(fixVertex ? "Permiso GPS pendiente: vértice demo fijado" : "Permiso GPS pendiente");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const fixPoint = () => {
    setGpsBusy(true);
    requestLocation(true);
  };

  const startScan = () => {
    setPoints([]);
    setAccuracy(null);
    setUserLocation(null);
    setLocationStatus("idle");
    setScanStatus("capturing");
    setModal(null);
    requestLocation(false);
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
    setLocationStatus("idle");
    announce("Scan finalizado");
  };

  const saveSurvey = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const record = {
      id: `SY-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      points,
      location: userLocation,
      accuracy,
      crop: String(formData.get("crop") || ""),
      harvestYear: String(formData.get("harvestYear") || ""),
      volume: String(formData.get("volume") || ""),
      destination: String(formData.get("destination") || ""),
      producer: String(formData.get("producer") || ""),
    };
    const existing = JSON.parse(window.localStorage.getItem("symmetry-eudr-parcels") || "[]") as unknown[];
    window.localStorage.setItem("symmetry-eudr-parcels", JSON.stringify([...existing, record]));
    setModal(null);
    setScanStatus("closed");
    announce(`Terreno ${record.id} guardado; puedes finalizar el scan`);
  };

  return (
    <div className={styles.page} data-server-page data-location-status={locationStatus}>
      <section className={styles.device} aria-label="Symmetry EUDR field visor">
        <header className={styles.deviceHeader}>
          <div className={styles.station}><span>GEOVISOR V2.4</span><strong>STATION: SYMMETRY-EUDR</strong></div>
          <div className={styles.uplink}><i /> UPLINK: ACTIVE</div>
        </header>

        <main className={styles.mapViewport}>
          <div className={styles.alertBar}>
            <span className={styles.alertIcon}>△</span>
            <div><small>EXTREME WIND: 85 KT</small><span>May affect field capture</span></div>
            <button type="button" onClick={() => announce("Alert acknowledged")}>Accept</button>
          </div>

          <div className={`${styles.mapCanvas} ${scanStatus === "capturing" ? styles.scanningMap : ""}`}>
            <div className={styles.satelliteTexture} aria-label="Symmetry satellite layer preview" />
            <div className={styles.mapGrid} aria-hidden="true" />
            <div className={styles.mapContours} aria-hidden="true" />
            {scanStatus === "capturing" && <div className={styles.scanGridOverlay} aria-hidden="true" />}
            <div className={styles.satelliteBadge}>{scanStatus === "closed" ? "TERRAIN READY / EUDR" : "SENTINEL-2 / NDVI"}</div>
            {userLocation && <span className={styles.userLocation} style={{ left: points.length ? `${41 + ((points.length - 1) % 4) * 10}%` : "50%", top: points.length ? `${38 + ((points.length - 1) % 3) * 13}%` : "50%" }}><i /><small>YOU</small></span>}
            {points.length > 1 && <svg className={styles.polygonSvg} viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Captured parcel boundary"><polyline points={points.map((_, index) => `${41 + (index % 4) * 10},${38 + (index % 3) * 13}`).join(" ")} /><polyline className={points.length >= 3 ? styles.polygonClosed : ""} points={points.length >= 3 ? `${points.map((_, index) => `${41 + (index % 4) * 10},${38 + (index % 3) * 13}`).join(" ")} 41,38` : ""} /></svg>}
            {points.map((point, index) => <span className={styles.vertex} key={`${point.lat}-${point.lon}`} style={{ left: `${41 + (index % 4) * 10}%`, top: `${38 + (index % 3) * 13}%` }}>{index + 1}</span>)}
            <div className={styles.mapWatermark}>For development purposes only</div>
            <div className={styles.zoomControls}><button type="button" aria-label="Zoom in" onClick={() => announce("Zoom +")}>＋</button><button type="button" aria-label="Zoom out" onClick={() => announce("Zoom −")}>−</button><span /></div>
            <button className={styles.compass} type="button" aria-label="Center map" onClick={() => announce("Map centered")}><span>◉</span></button>
            {scanStatus === "capturing" && <div className={styles.scanDock}><div className={styles.scanDockMeta}><span>POLYGON LAND / DEFINITION</span><strong>{String(points.length).padStart(2, "0")} VERTICES</strong></div><div className={styles.scanDockActions}><button className={styles.fixButton} type="button" disabled={gpsBusy} onClick={fixPoint}>{gpsBusy ? "READING GPS…" : `FIX POINT ${points.length + 1}`}</button><button className={styles.previewButton} type="button" disabled={points.length === 0} onClick={undoLastPoint}>PREVIEW / RETURN</button><button className={styles.closeButton} type="button" disabled={points.length < 3} onClick={closePolygon}>CLOSE POLYGON <ArrowRight /></button></div></div>}
          </div>

          <div className={styles.coordinates}><span>LAT: <b>82.8028° S</b></span><span>LON: <b>135.0000° E</b></span><span>ALT: <b>2,835M</b></span></div>
          <div className={styles.layers}><small>ACTIVE LAYERS</small><div ref={layersStripRef} onPointerDown={startLayerDrag} onPointerMove={moveLayerDrag} onPointerUp={endLayerDrag} onPointerCancel={() => endLayerDrag()} onPointerLeave={() => endLayerDrag()}>{(Object.keys(layerLabels) as Layer[]).map((layer) => <button className={activeLayers.includes(layer) ? styles.layerActive : ""} type="button" key={layer} onClick={() => toggleLayer(layer)}><i /> {layerLabels[layer]}</button>)}</div></div>
          <div className={styles.actionDock}><button className={`${styles.scanButton} ${scanStatus !== "idle" ? styles.scanActive : ""}`} type="button" onClick={scanStatus === "idle" ? startScan : finishScan}><span>◎</span> {scanStatus === "idle" ? "INITIATE SCAN" : "CLOSE SCAN"}</button><button className={styles.harvestButton} type="button" aria-label="Add harvest record" onClick={() => setModal("harvest")}><span /><span /><span /><span /></button></div>
        </main>
      </section>

      {toast && <div className={styles.toast}><CheckIcon />{toast}</div>}

      {modal && <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
        {modal === "survey" && <form className={styles.modal} onSubmit={saveSurvey}>
          <div className={styles.modalHeader}><div><small>POLYGON CLOSED / EUDR</small><h2>Harvest <i>survey.</i></h2></div><button type="button" onClick={() => setModal(null)} aria-label="Close"><CloseIcon /></button></div>
          <p>Completa la información mínima para conectar la parcela con producción y exportación.</p>
          <label>Crop / product<input name="crop" required placeholder="Cacao" /></label>
          <div className={styles.formRow}><label>Harvest year<input name="harvestYear" required type="number" placeholder="2026" /></label><label>Volume<input name="volume" required placeholder="2.4 t" /></label></div>
          <label>Export destination<input name="destination" required placeholder="European Union" /></label>
          <label>Producer / cooperative<input name="producer" required placeholder="Association name" /></label>
          <div className={styles.modalActions}><button className={styles.cancelButton} type="button" onClick={() => setModal(null)}>SAVE LATER</button><button className={styles.saveButton} type="submit">SAVE SURVEY <ArrowRight /></button></div>
        </form>}

        {modal === "harvest" && <form className={styles.modal} onSubmit={(event) => { event.preventDefault(); setModal(null); announce("Harvest record saved in demo workspace"); }}>
          <div className={styles.modalHeader}><div><small>HARVEST RECORD / EUDR</small><h2>Add a <i>harvest.</i></h2></div><button type="button" onClick={() => setModal(null)} aria-label="Close"><CloseIcon /></button></div>
          <p>Connect production information to the selected parcel.</p>
          <label>Crop / product<input required placeholder="Cacao" /></label>
          <div className={styles.formRow}><label>Harvest year<input required type="number" placeholder="2026" /></label><label>Volume<input required placeholder="2.4 t" /></label></div>
          <div className={styles.modalActions}><button className={styles.cancelButton} type="button" onClick={() => setModal(null)}>CANCEL</button><button className={styles.saveButton} type="submit">SAVE RECORD <ArrowRight /></button></div>
        </form>}
      </div>}
    </div>
  );
}
