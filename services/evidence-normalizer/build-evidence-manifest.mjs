import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const repoRoot = process.cwd();
const rawInput = process.argv[2];

if (!rawInput) {
  throw new Error("Pass a JSON payload to build an evidence manifest.");
}

const input = JSON.parse(rawInput);
const now = new Date().toISOString();

const manifest = {
  manifestVersion: "1.0.0",
  manifestId: input.manifestId ?? crypto.randomUUID(),
  enterpriseRoot: input.enterpriseRoot ?? "0x0000000000000000000000000000000000000000",
  localEnterpriseId: input.localEnterpriseId ?? 1,
  service: input.service ?? "shared",
  subjectType: input.subjectType ?? "enterprise",
  subjectId: input.subjectId ?? "unspecified",
  evidenceType: input.evidenceType ?? "generic-evidence",
  contentDigestKeccak256: input.contentDigestKeccak256 ?? "0x" + "0".repeat(64),
  payload: input.payload ?? {
    canonicalFilename: "evidence.bin",
    mimeType: "application/octet-stream",
    sizeBytes: 0,
  },
  locations: input.locations ?? {},
  createdBy: input.createdBy ?? "symmetry-ops",
  createdAt: input.createdAt ?? now,
  supersedesManifestId: input.supersedesManifestId ?? null,
  status: input.status ?? "replicating",
  replication: input.replication ?? {
    operational: { present: true, verifiedAt: now },
    ipfs: { present: false, pinningTargetsRequired: 2, healthyPinningTargets: 0, verifiedAt: null },
    filecoin: { present: false, replicasRequired: 2, activeReplicas: 0, renewBeforeDaysRemaining: 30, verifiedAt: null },
    arweave: { present: false, verifiedAt: null },
    onChainAnchor: { present: false, evidenceId: null, txHash: null, verifiedAt: null },
  },
};

const outputDir = path.join(repoRoot, "services", "evidence-normalizer", "generated");
fs.mkdirSync(outputDir, { recursive: true });
const filePath = path.join(outputDir, `${manifest.manifestId}.json`);
fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2));

console.log(JSON.stringify({ filePath, manifest }, null, 2));
