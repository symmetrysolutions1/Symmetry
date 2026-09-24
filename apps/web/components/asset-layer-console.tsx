"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Asset = {
  id: string;
  assetRef: string;
  assetType: string;
  quantity: number;
  unit: string;
  currentCustodian: string;
  status: string;
  passportId?: string;
  certificateId?: string;
};

type Workspace = {
  workspaceId: string;
  enterpriseId: number;
  rootAddress: string;
  priorityMaterial?: string;
  materialScope: string[];
  baseUnit: string;
  operatorWallet?: string;
  auditorWallets: string[];
  assets: Asset[];
  events: { type: string; createdAt: string }[];
};

type Metrics = {
  assetCount: number;
  activeAssetCount: number;
  verifiedAssetCount: number;
  certificateCount: number;
  redeemedAssetCount: number;
  totalQuantity: number;
  eventCount: number;
};

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const defaultOperator = "0x1111111111111111111111111111111111111111";
const defaultVerifier = "0x2222222222222222222222222222222222222222";
const defaultRecycler = "0x3333333333333333333333333333333333333333";
const materialProfiles = {
  ALUMINUM: {
    inputType: "ALUMINUM_POST_CONSUMER",
    outputType: "ALUMINUM_RECYCLED_INGOT",
    inputPrefix: "LAZ-ALU-2026-",
    outputPrefix: "LAZ-RALU-2026-",
  },
  PET: {
    inputType: "PET_POST_CONSUMER",
    outputType: "PET_RECYCLED_FLAKE",
    inputPrefix: "LAZ-PET-2026-",
    outputPrefix: "LAZ-RPET-2026-",
  },
} as const;

type MaterialKey = keyof typeof materialProfiles;

function outputTypeFor(inputType: string) {
  return inputType === materialProfiles.PET.inputType
    ? materialProfiles.PET.outputType
    : materialProfiles.ALUMINUM.outputType;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await response.json()) as T & { message?: string };
  if (!response.ok) throw new Error(data.message || "La API no pudo completar la operación.");
  return data;
}

function digest(label: string) {
  return `pilot-${label}-${Date.now()}`;
}

export function AssetLayerConsole() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [message, setMessage] = useState("Conectando con el workspace de LazosTech…");
  const [busy, setBusy] = useState(false);
  const [workspaceForm, setWorkspaceForm] = useState({
    rootAddress: defaultOperator,
    operatorWallet: defaultOperator,
    auditorWallet: defaultVerifier,
  });
  const [assetForm, setAssetForm] = useState({
    materialKey: "ALUMINUM" as MaterialKey,
    assetRef: "LAZ-ALU-2026-0001",
    quantity: "500000",
    issuer: defaultOperator,
  });
  const [custodian, setCustodian] = useState(defaultRecycler);
  const [transformForm, setTransformForm] = useState({
    outputAssetRef: "LAZ-RALU-2026-0001",
    outputQuantity: "425000",
    rejectedQuantity: "75000",
    actor: defaultRecycler,
  });

  const selectedNextAsset = useMemo(
    () => workspace?.assets.find((asset) => ["registered", "verified", "in_custody", "certified"].includes(asset.status)),
    [workspace],
  );

  async function refresh(workspaceId: string) {
    const [nextWorkspace, nextMetrics] = await Promise.all([
      request<Workspace>(`/asset-layer/workspaces/${workspaceId}`),
      request<Metrics>(`/asset-layer/workspaces/${workspaceId}/metrics`),
    ]);
    setWorkspace(nextWorkspace);
    setMetrics(nextMetrics);
  }

  useEffect(() => {
    request<Workspace[]>("/asset-layer/workspaces")
      .then(async (workspaces) => {
        if (workspaces[0]) {
          await refresh(workspaces[0].workspaceId);
          setMessage("Workspace conectado. La consola está lista para el piloto.");
        } else {
          setMessage("No existe un workspace todavía. Crea el root piloto para comenzar.");
        }
      })
      .catch((error: Error) => setMessage(`${error.message} Configura NEXT_PUBLIC_API_URL si la API está en otro puerto.`));
  }, []);

  async function createWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const created = await request<Workspace>("/asset-layer/workspaces", {
        method: "POST",
        body: JSON.stringify({
          enterpriseId: 1,
          rootAddress: workspaceForm.rootAddress,
          operatorWallet: workspaceForm.operatorWallet,
          auditorWallets: [workspaceForm.auditorWallet],
          priorityMaterial: "ALUMINUM_POST_CONSUMER",
          materialScope: ["ALUMINUM_POST_CONSUMER", "ALUMINUM_RECYCLED_INGOT", "PET_POST_CONSUMER", "PET_RECYCLED_FLAKE"],
          serviceConfigUri: "ipfs://symmetry/asset-layer/lazostech-v1",
        }),
      });
      await refresh(created.workspaceId);
      setMessage("Root de LazosTech creado. Ya puedes registrar el primer lote.");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function registerAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace) return;
    setBusy(true);
    try {
      await request(`/asset-layer/workspaces/${workspace.workspaceId}/assets`, {
        method: "POST",
        body: JSON.stringify({
          assetRef: assetForm.assetRef,
          assetType: materialProfiles[assetForm.materialKey].inputType,
          quantity: Number(assetForm.quantity),
          unit: "g",
          originDigest: digest("origin"),
          metadataUri: "ipfs://symmetry/asset-layer/lazostech/asset",
          issuer: assetForm.issuer,
          initialCustodian: assetForm.issuer,
        }),
      });
      await refresh(workspace.workspaceId);
      setMessage(`Lote ${assetForm.assetRef} registrado y listo para verificar.`);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function advanceAsset(asset: Asset) {
    if (!workspace) return;
    setBusy(true);
    try {
      const base = `/asset-layer/workspaces/${workspace.workspaceId}/assets/${asset.id}`;
      if (!asset.passportId) {
        await request(`${base}/passports`, {
          method: "POST",
          body: JSON.stringify({ metadataDigest: digest("passport"), metadataUri: "ipfs://symmetry/asset-layer/passport", issuedBy: workspace.operatorWallet }),
        });
        setMessage(`${asset.assetRef}: pasaporte digital emitido.`);
      } else if (asset.status === "registered") {
        await request(`${base}/verifications`, {
          method: "POST",
          body: JSON.stringify({ verificationType: "EXISTENCE_WEIGHT_ORIGIN", verifiedQuantity: asset.quantity, approved: true, evidenceDigest: digest("verification"), evidenceUri: "ipfs://symmetry/asset-layer/evidence", verifier: workspace.auditorWallets[0] }),
        });
        setMessage(`${asset.assetRef}: verificación aprobada.`);
      } else if (asset.status === "verified" && asset.assetType === outputTypeFor(asset.assetType)) {
        await request(`${base}/certificates`, {
          method: "POST",
          body: JSON.stringify({ certificateType: "TRACEABILITY_CERTIFICATE", certificateDigest: digest("certificate"), certificateUri: "ipfs://symmetry/asset-layer/certificate", passportUri: "ipfs://symmetry/asset-layer/passport", issuedBy: workspace.auditorWallets[0] }),
        });
        setMessage(`${asset.assetRef}: certificado de trazabilidad emitido.`);
      } else if (asset.status === "verified") {
        await request(`${base}/custody`, {
          method: "POST",
          body: JSON.stringify({ toCustodian: custodian, manifestDigest: digest("custody"), manifestUri: "ipfs://symmetry/asset-layer/custody", actor: workspace.operatorWallet }),
        });
        setMessage(`${asset.assetRef}: custodia transferida al transformador.`);
      } else if (asset.status === "in_custody") {
        await request(`/asset-layer/workspaces/${workspace.workspaceId}/transformations`, {
          method: "POST",
          body: JSON.stringify({ inputAssetId: asset.id, outputAssetRef: transformForm.outputAssetRef, outputAssetType: outputTypeFor(asset.assetType), outputQuantity: Number(transformForm.outputQuantity), rejectedQuantity: Number(transformForm.rejectedQuantity), evidenceDigest: digest("transformation"), evidenceUri: "ipfs://symmetry/asset-layer/transformation", outputMetadataUri: "ipfs://symmetry/asset-layer/output", actor: transformForm.actor }),
        });
        setMessage(`${asset.assetRef}: transformación registrada con balance de masa.`);
      } else if (asset.status === "certified") {
        await request(`${base}/redemptions`, {
          method: "POST",
          body: JSON.stringify({ redemptionDigest: digest("redemption"), redemptionUri: "ipfs://symmetry/asset-layer/redemption", actor: asset.currentCustodian }),
        });
        setMessage(`${asset.assetRef}: activo retirado y cerrado.`);
      }
      await refresh(workspace.workspaceId);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="asset-console">
      <div className="asset-console-topline">
        <span className="eyebrow">Symmetry Asset Layer / pilot console</span>
        <span className="asset-console-api">API: {apiBase}</span>
      </div>
      <div className="asset-console-status" role="status">{message}</div>

      {!workspace ? (
        <form className="asset-console-card asset-console-setup" onSubmit={createWorkspace}>
          <div>
            <span className="asset-console-kicker">01 / Root empresarial</span>
            <h2>Conectar LazosTech con Symmetry</h2>
            <p>Este workspace representa el primer root empresarial del servicio. En producción, estos campos deben venir de identidad y autorización corporativas.</p>
          </div>
          <label>Root address<input value={workspaceForm.rootAddress} onChange={(event) => setWorkspaceForm({ ...workspaceForm, rootAddress: event.target.value })} /></label>
          <label>Operador<input value={workspaceForm.operatorWallet} onChange={(event) => setWorkspaceForm({ ...workspaceForm, operatorWallet: event.target.value })} /></label>
          <label>Auditor<input value={workspaceForm.auditorWallet} onChange={(event) => setWorkspaceForm({ ...workspaceForm, auditorWallet: event.target.value })} /></label>
          <button className="button button-accent" type="submit" disabled={busy}>{busy ? "Creando…" : "Crear workspace piloto"}</button>
        </form>
      ) : (
        <>
          <section className="asset-console-header">
            <div>
              <span className="asset-console-kicker">LazosTech / enterprise root #{workspace.enterpriseId}</span>
              <h1>Inventario verificable de materiales circulares.</h1>
              <p>Un centro operativo para registrar, verificar, transferir, transformar, certificar y retirar lotes de aluminio. PET permanece disponible como segundo material del servicio.</p>
            </div>
            <div className="asset-console-root"><span>Workspace</span><strong>{workspace.workspaceId.slice(0, 8)}</strong><small>{workspace.materialScope.join(" · ")}</small></div>
          </section>
          <section className="asset-metrics" aria-label="Métricas del piloto">
            {[[metrics?.assetCount ?? 0, "activos"], [metrics?.verifiedAssetCount ?? 0, "verificados"], [metrics?.certificateCount ?? 0, "certificados"], [metrics?.redeemedAssetCount ?? 0, "retirados"], [metrics?.totalQuantity ?? 0, "gramos registrados"], [metrics?.eventCount ?? 0, "eventos"]].map(([value, label]) => <div key={label}><strong>{value.toLocaleString("es-CO")}</strong><span>{label}</span></div>)}
          </section>
          <div className="asset-console-grid">
            <form className="asset-console-card" onSubmit={registerAsset}>
              <span className="asset-console-kicker">02 / Registro</span>
              <h2>Crear lote de aluminio</h2>
              <p>El MVP trabaja con gramos y mantiene el scope deliberadamente estrecho.</p>
              <label>Material<select value={assetForm.materialKey} onChange={(event) => { const materialKey = event.target.value as MaterialKey; const profile = materialProfiles[materialKey]; setAssetForm({ ...assetForm, materialKey, assetRef: `${profile.inputPrefix}0001` }); setTransformForm({ ...transformForm, outputAssetRef: `${profile.outputPrefix}0001` }); }}><option value="ALUMINUM">Latas de aluminio</option><option value="PET">PET posconsumo</option></select></label>
              <label>Referencia<input value={assetForm.assetRef} onChange={(event) => setAssetForm({ ...assetForm, assetRef: event.target.value })} /></label>
              <label>Cantidad (g)<input type="number" min="1" value={assetForm.quantity} onChange={(event) => setAssetForm({ ...assetForm, quantity: event.target.value })} /></label>
              <button className="button button-dark" type="submit" disabled={busy}>Registrar lote</button>
            </form>
            <div className="asset-console-card asset-console-workflow">
              <div className="asset-console-card-heading"><div><span className="asset-console-kicker">03 / Lifecycle</span><h2>Operación por etapas</h2></div><span className="asset-console-count">{workspace.assets.length} lotes</span></div>
              <div className="asset-console-fields"><label>Próximo custodio<input value={custodian} onChange={(event) => setCustodian(event.target.value)} /></label><label>Salida transformada<input value={transformForm.outputAssetRef} onChange={(event) => setTransformForm({ ...transformForm, outputAssetRef: event.target.value })} /></label></div>
              <div className="asset-asset-list">{workspace.assets.length === 0 ? <p className="asset-console-empty">No hay lotes registrados.</p> : workspace.assets.map((asset) => <article className="asset-row" key={asset.id}><div><strong>{asset.assetRef}</strong><span>{asset.assetType} · {asset.quantity.toLocaleString("es-CO")} {asset.unit}</span></div><div className="asset-row-actions"><b className={`asset-status asset-status-${asset.status}`}>{asset.status.replaceAll("_", " ")}</b><button type="button" className="button button-small button-accent" onClick={() => advanceAsset(asset)} disabled={busy || asset.status === "transformed" || asset.status === "redeemed"}>{asset.status === "transformed" ? "Entrada cerrada" : asset.status === "redeemed" ? "Retirado" : "Siguiente etapa"}</button></div></article>)}</div>
              {selectedNextAsset && <small className="asset-console-hint">Seleccionado automáticamente: {selectedNextAsset.assetRef}. La prueba de masa exige salida + rechazo = entrada.</small>}
            </div>
          </div>
          <section className="asset-console-card asset-console-audit"><div><span className="asset-console-kicker">04 / Evidencia</span><h2>Historial de auditoría</h2></div><div className="asset-event-list">{workspace.events.slice().reverse().slice(0, 8).map((event, index) => <div key={`${event.type}-${event.createdAt}-${index}`}><span>{event.type.replaceAll("_", " ")}</span><time>{new Date(event.createdAt).toLocaleString("es-CO")}</time></div>)}</div></section>
        </>
      )}
      <p className="asset-console-disclaimer">Modo piloto: esta consola usa la persistencia local del API y no sustituye autenticación empresarial, base de datos gestionada, revisión jurídica ni una transacción on-chain confirmada.</p>
    </div>
  );
}
