import fs from "node:fs";
import path from "node:path";
import { evidenceAnchorDigest } from "./canonical-evidence.mjs";

const manifestPath = process.argv[2];
const live = process.argv.includes("--live");
if (!manifestPath) throw new Error("Pass the path to an evidence manifest JSON file.");

if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(path.join(process.cwd(), ".env"));
  } catch {}
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const findings = [];
const liveChecks = [];
const maxAgeHours = Number(process.env.EVIDENCE_MAX_VERIFICATION_AGE_HOURS ?? 24);

function finding(message) {
  findings.push(message);
}

function isPlaceholder(value) {
  return !value || /placeholder|example|0000000000000000000000000000000000000000/i.test(String(value));
}

function checkFreshness(label, verifiedAt) {
  if (!verifiedAt) return finding(`${label} has no verification timestamp`);
  const ageMs = Date.now() - Date.parse(verifiedAt);
  if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > maxAgeHours * 60 * 60 * 1000) {
    finding(`${label} verification is stale or invalid`);
  }
}

async function fetchCheck(label, url, options = {}) {
  try {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(20_000) });
    const ok = response.ok;
    liveChecks.push({ label, ok, status: response.status });
    if (!ok) finding(`${label} returned HTTP ${response.status}`);
  } catch (error) {
    liveChecks.push({ label, ok: false, error: error.message });
    finding(`${label} is unreachable`);
  }
}

if (!/^0x[a-fA-F0-9]{40}$/.test(manifest.enterpriseRoot ?? "")) finding("Invalid enterprise root");
if (!/^0x[a-fA-F0-9]{64}$/.test(manifest.contentDigestKeccak256 ?? "")) finding("Invalid content digest");
if (!manifest.replication?.operational?.present) finding("Operational copy missing");
if ((manifest.replication?.ipfs?.healthyPinningTargets ?? 0) < (manifest.replication?.ipfs?.pinningTargetsRequired ?? 0)) {
  finding("IPFS below minimum healthy pinning targets");
}
if ((manifest.replication?.filecoin?.activeReplicas ?? 0) < (manifest.replication?.filecoin?.replicasRequired ?? 0)) {
  finding("Filecoin below minimum replicas");
}
if (!manifest.replication?.arweave?.present) finding("Arweave archive missing");
if (!manifest.replication?.onChainAnchor?.present) finding("On-chain anchor missing");

if (live) {
  if (!/^0x[a-fA-F0-9]{64}$/.test(manifest.anchorDigestKeccak256 ?? "")) {
    finding("Canonical anchor digest missing");
  } else if (evidenceAnchorDigest(manifest) !== manifest.anchorDigestKeccak256) {
    finding("Canonical anchor digest mismatch");
  }
  if (!["anchored", "repaired"].includes(manifest.status)) finding("Manifest is not in an anchored production state");
  for (const [label, layer] of Object.entries(manifest.replication ?? {})) checkFreshness(label, layer?.verifiedAt);

  const ipfsCid = manifest.locations?.ipfsCid;
  if (isPlaceholder(ipfsCid)) {
    finding("IPFS CID missing or placeholder");
  } else {
    const gateway = (process.env.IPFS_GATEWAY_URL ?? "https://ipfs.io/ipfs").replace(/\/$/, "");
    await fetchCheck("ipfs", `${gateway}/${ipfsCid}`, { headers: { range: "bytes=0-0" } });
  }

  const dealIds = manifest.locations?.filecoinDealIds ?? [];
  const dealTemplate = process.env.FILECOIN_DEAL_STATUS_URL_TEMPLATE;
  if (dealIds.length < (manifest.replication?.filecoin?.replicasRequired ?? 1)) {
    finding("Not enough Filecoin deal IDs recorded");
  } else if (!dealTemplate || !dealTemplate.includes("{dealId}")) {
    finding("FILECOIN_DEAL_STATUS_URL_TEMPLATE is missing");
  } else {
    for (const dealId of dealIds) {
      await fetchCheck(`filecoin:${dealId}`, dealTemplate.replace("{dealId}", encodeURIComponent(dealId)));
    }
  }

  const arweaveTxId = manifest.locations?.arweaveTxId;
  if (isPlaceholder(arweaveTxId)) {
    finding("Arweave transaction ID missing or placeholder");
  } else {
    const gateway = (process.env.ARWEAVE_GATEWAY_URL ?? "https://arweave.net").replace(/\/$/, "");
    await fetchCheck("arweave", `${gateway}/tx/${arweaveTxId}/status`);
  }

  const txHash = manifest.replication?.onChainAnchor?.txHash;
  const rpcUrl = process.env.RPC_URL_BASE ?? process.env.RPC_URL_BASE_SEPOLIA ?? process.env.RPC_URL;
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash ?? "") || !rpcUrl) {
    finding("On-chain receipt cannot be checked");
  } else {
    try {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getTransactionReceipt", params: [txHash] }),
        signal: AbortSignal.timeout(20_000),
      });
      const payload = await response.json();
      const ok = payload.result?.status === "0x1";
      liveChecks.push({ label: "on-chain-anchor", ok, status: payload.result?.status ?? null });
      if (!ok) finding("On-chain anchor receipt is missing or failed");
    } catch (error) {
      liveChecks.push({ label: "on-chain-anchor", ok: false, error: error.message });
      finding("On-chain anchor RPC check failed");
    }
  }
}

const healthy = findings.length === 0;
console.log(JSON.stringify({ healthy, live, findings, liveChecks, manifestId: manifest.manifestId }, null, 2));
process.exit(healthy ? 0 : 1);
