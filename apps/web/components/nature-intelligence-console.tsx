"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Position = [number, number];
type Workspace = {
  workspaceId: string; name: string;
  territories: Array<{ id: string; name: string; geometry: { coordinates: Position[][] } }>;
  observations: Array<{ id: string; territoryId: string; capturedAt: string; metrics: { ndviMean: number; treeCoverPercentage: number; cloudCoverPercentage: number }; comparison?: { ndviChange: number; treeCoverChangePercentagePoints: number } }>;
  alerts: Array<{ id: string; severity: string; status: string; reasons: string[]; createdAt: string }>;
  evidencePassports: Array<{ id: string; status: string }>;
};
const defaultApi = process.env.NEXT_PUBLIC_SYMMETRY_API_URL ?? "http://localhost:3000";

export function NatureIntelligenceConsole() {
  const [apiUrl, setApiUrl] = useState(defaultApi); const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedId, setSelectedId] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const response = await fetch(`${apiUrl.replace(/\/$/, "")}/nature/workspaces`, { cache: "no-store" }); if (!response.ok) throw new Error(`API ${response.status}`); const data = await response.json() as Workspace[]; setWorkspaces(data); setSelectedId((current) => current || data[0]?.workspaceId || ""); } catch (cause) { setError(cause instanceof Error ? cause.message : "No fue posible consultar Nature Intelligence"); } finally { setLoading(false); } }, [apiUrl]);
  useEffect(() => { void load(); }, [load]);
  const workspace = workspaces.find((item) => item.workspaceId === selectedId);
  const latest = useMemo(() => [...(workspace?.observations ?? [])].sort((a, b) => Date.parse(b.capturedAt) - Date.parse(a.capturedAt))[0], [workspace]);
  async function resolveAlert(alertId: string, status: "validated" | "dismissed") { if (!workspace) return; const response = await fetch(`${apiUrl.replace(/\/$/, "")}/nature/workspaces/${workspace.workspaceId}/alerts/${alertId}/resolve`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ status, actor: "nature-console-operator", note: `Resolución registrada desde la consola: ${status}` }) }); if (!response.ok) { setError(`No fue posible resolver la alerta (${response.status})`); return; } await load(); }
  return <div className="nature-console">
    <div className="nature-console-toolbar"><label>API<input value={apiUrl} onChange={(event) => setApiUrl(event.target.value)} /></label><label>Workspace<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}><option value="">Selecciona un workspace</option>{workspaces.map((item) => <option key={item.workspaceId} value={item.workspaceId}>{item.name}</option>)}</select></label><button type="button" onClick={() => void load()}>{loading ? "Actualizando…" : "Actualizar"}</button></div>
    {error && <p className="nature-console-error">{error}. Verifica que el API esté ejecutándose y que CORS permita este origen.</p>}
    {!workspace ? <div className="nature-empty">No hay un workspace cargado todavía.</div> : <>
      <div className="nature-metric-grid"><Metric label="Territorios" value={workspace.territories.length} /><Metric label="Observaciones" value={workspace.observations.length} /><Metric label="Alertas abiertas" value={workspace.alerts.filter((item) => item.status === "open").length} /><Metric label="Pasaportes anclados" value={workspace.evidencePassports.filter((item) => item.status === "anchored").length} /></div>
      <div className="nature-console-grid"><section className="nature-panel nature-map-panel"><div><span className="eyebrow">Territorio</span><h2>{workspace.territories[0]?.name ?? "Sin territorio"}</h2></div><TerritoryMap positions={workspace.territories[0]?.geometry.coordinates[0] ?? []} /></section><section className="nature-panel"><span className="eyebrow">Última observación</span>{latest ? <div className="nature-reading"><strong>{latest.metrics.ndviMean.toFixed(3)}</strong><span>NDVI medio</span><dl><div><dt>Cobertura</dt><dd>{latest.metrics.treeCoverPercentage}%</dd></div><div><dt>Nubes</dt><dd>{latest.metrics.cloudCoverPercentage}%</dd></div><div><dt>Cambio NDVI</dt><dd>{latest.comparison?.ndviChange ?? "—"}</dd></div></dl></div> : <p>Sin observaciones.</p>}</section></div>
      <section className="nature-panel"><span className="eyebrow">Cola de validación</span><h2>Alertas ambientales</h2><div className="nature-alert-list">{workspace.alerts.length === 0 && <p>No hay alertas.</p>}{workspace.alerts.map((alert) => <article key={alert.id}><div><span className={`nature-status nature-status-${alert.severity}`}>{alert.severity}</span><strong>{alert.reasons.join(" · ")}</strong><small>{new Date(alert.createdAt).toLocaleString("es-CO")} · {alert.status}</small></div>{alert.status === "open" && <div><button onClick={() => void resolveAlert(alert.id, "validated")}>Validar</button><button className="button-quiet" onClick={() => void resolveAlert(alert.id, "dismissed")}>Descartar</button></div>}</article>)}</div></section>
    </>}
  </div>;
}
function Metric({ label, value }: { label: string; value: number }) { return <article><strong>{value}</strong><span>{label}</span></article>; }
function TerritoryMap({ positions }: { positions: Position[] }) { if (positions.length < 3) return <div className="nature-map-empty">Registra un polígono para visualizarlo.</div>; const xs = positions.map(([x]) => x); const ys = positions.map(([, y]) => y); const minX = Math.min(...xs); const maxX = Math.max(...xs); const minY = Math.min(...ys); const maxY = Math.max(...ys); const width = Math.max(maxX - minX, 0.0001); const height = Math.max(maxY - minY, 0.0001); const points = positions.map(([x, y]) => `${20 + ((x - minX) / width) * 560},${300 - ((y - minY) / height) * 260}`).join(" "); return <svg className="nature-map" viewBox="0 0 600 320" role="img" aria-label="Polígono del territorio monitoreado"><defs><linearGradient id="nature-fill" x1="0" x2="1"><stop stopColor="#79d6a3" stopOpacity=".85"/><stop offset="1" stopColor="#d5f36f" stopOpacity=".55"/></linearGradient></defs><path d="M0 72 C160 25 420 130 600 52 V320 H0Z" fill="#0e3028"/><path d="M0 210 C190 150 390 260 600 170" fill="none" stroke="#26584d" strokeWidth="18"/><polygon points={points} fill="url(#nature-fill)" stroke="#dfff8c" strokeWidth="3"/><circle cx="480" cy="70" r="6" fill="#ffcc66"/></svg>; }
