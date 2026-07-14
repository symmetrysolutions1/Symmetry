import fs from "node:fs";
import path from "node:path";
import { evidenceAnchorDigest } from "./canonical-evidence.mjs";

const [manifestPath, receiptsPath] = process.argv.slice(2);
if (!manifestPath || !receiptsPath) {
  throw new Error("Pass a draft manifest path and a provider receipts path.");
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const receipts = JSON.parse(fs.readFileSync(receiptsPath, "utf8"));
const now = new Date().toISOString();
const pinningTargets = receipts.ipfs?.pinningTargets ?? [];
const filecoinDeals = receipts.filecoin?.deals ?? [];

if (!receipts.operational?.uri) throw new Error("Operational storage receipt missing.");
if (!receipts.ipfs?.cid || pinningTargets.length < 2) throw new Error("Two healthy IPFS pinning receipts are required.");
if (!receipts.filecoin?.payloadCid || filecoinDeals.length < 2) throw new Error("Two Filecoin deal receipts are required.");
if (!receipts.arweave?.txId) throw new Error("Arweave transaction receipt missing.");
if (!/^0x[a-fA-F0-9]{64}$/.test(manifest.anchorDigestKeccak256 ?? "")) {
  throw new Error("Prepare the canonical anchor digest before broadcasting the on-chain anchor.");
}
if (!Number.isInteger(receipts.onChain?.evidenceId) || !/^0x[a-fA-F0-9]{64}$/.test(receipts.onChain?.txHash ?? "")) {
  throw new Error("Successful on-chain anchor receipt missing.");
}

manifest.locations = {
  operationalStorageUri: receipts.operational.uri,
  ipfsCid: receipts.ipfs.cid,
  filecoinPayloadCid: receipts.filecoin.payloadCid,
  filecoinDealIds: filecoinDeals.map((deal) => deal.id),
  arweaveTxId: receipts.arweave.txId,
};
const recomputedAnchorDigest = evidenceAnchorDigest(manifest);
if (recomputedAnchorDigest !== manifest.anchorDigestKeccak256) {
  throw new Error("Storage receipts changed after the canonical anchor digest was prepared.");
}
manifest.status = "anchored";
manifest.replication = {
  operational: { present: true, verifiedAt: receipts.operational.verifiedAt ?? now },
  ipfs: {
    present: true,
    pinningTargetsRequired: 2,
    healthyPinningTargets: pinningTargets.length,
    verifiedAt: receipts.ipfs.verifiedAt ?? now,
    targets: pinningTargets,
  },
  filecoin: {
    present: true,
    replicasRequired: 2,
    activeReplicas: filecoinDeals.length,
    renewBeforeDaysRemaining: receipts.filecoin.renewBeforeDaysRemaining ?? 30,
    verifiedAt: receipts.filecoin.verifiedAt ?? now,
    deals: filecoinDeals,
  },
  arweave: { present: true, verifiedAt: receipts.arweave.verifiedAt ?? now },
  onChainAnchor: {
    present: true,
    evidenceId: receipts.onChain.evidenceId,
    txHash: receipts.onChain.txHash,
    verifiedAt: receipts.onChain.verifiedAt ?? now,
  },
};

const outputDir = path.join(process.cwd(), "services", "evidence-normalizer", "generated");
fs.mkdirSync(outputDir, { recursive: true });
const outputPath = path.join(outputDir, `${manifest.manifestId}.anchored.json`);
fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ outputPath, anchorDigestKeccak256: manifest.anchorDigestKeccak256 }, null, 2));
