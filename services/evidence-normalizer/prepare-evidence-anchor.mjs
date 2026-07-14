import fs from "node:fs";
import path from "node:path";
import { evidenceAnchorDigest } from "./canonical-evidence.mjs";

const [manifestPath, receiptsPath] = process.argv.slice(2);
if (!manifestPath || !receiptsPath) {
  throw new Error("Pass a draft manifest path and storage provider receipts path.");
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const receipts = JSON.parse(fs.readFileSync(receiptsPath, "utf8"));
const pinningTargets = receipts.ipfs?.pinningTargets ?? [];
const filecoinDeals = receipts.filecoin?.deals ?? [];

if (!receipts.operational?.uri) throw new Error("Operational storage receipt missing.");
if (!receipts.ipfs?.cid || pinningTargets.length < 2) throw new Error("Two healthy IPFS pinning receipts are required.");
if (!receipts.filecoin?.payloadCid || filecoinDeals.length < 2) throw new Error("Two Filecoin deal receipts are required.");
if (!receipts.arweave?.txId) throw new Error("Arweave transaction receipt missing.");

manifest.locations = {
  operationalStorageUri: receipts.operational.uri,
  ipfsCid: receipts.ipfs.cid,
  filecoinPayloadCid: receipts.filecoin.payloadCid,
  filecoinDealIds: filecoinDeals.map((deal) => deal.id),
  arweaveTxId: receipts.arweave.txId,
};
manifest.anchorDigestKeccak256 = evidenceAnchorDigest(manifest);
manifest.status = "replicating";

const outputDir = path.join(process.cwd(), "services", "evidence-normalizer", "generated");
fs.mkdirSync(outputDir, { recursive: true });
const outputPath = path.join(outputDir, `${manifest.manifestId}.prepared.json`);
fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ outputPath, anchorDigestKeccak256: manifest.anchorDigestKeccak256 }, null, 2));
