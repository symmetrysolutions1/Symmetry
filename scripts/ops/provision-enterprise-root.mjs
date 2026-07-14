import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const baseEnterprisesDir = path.join(repoRoot, "storage", "object-store", "enterprises");

const defaults = {
  legalName: "Symmetry Test Exporters SAS",
  jurisdictionCode: "CO",
  enterpriseId: "enterprise-0001",
  rootAddress: null,
  enabledServices: ["votoid", "automation", "eudr"],
};

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, payload) {
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
}

const rawArg = process.argv[2];
const input = rawArg ? JSON.parse(rawArg) : defaults;
const enterpriseSlug = `${input.enterpriseId}-${slugify(input.legalName)}`;
const enterpriseRoot = path.join(baseEnterprisesDir, enterpriseSlug);

const sharedDirs = [
  "identity",
  "evidence",
  "evidence/manifests",
  "evidence/canonical",
  "evidence/replication",
  "audit",
  "integrations",
  "exports",
  "compliance",
];

const serviceDirs = {
  votoid: ["services/votoid/config", "services/votoid/evidence", "services/votoid/boards"],
  automation: ["services/automation/config", "services/automation/workflows", "services/automation/checkpoints"],
  eudr: ["services/eudr/config", "services/eudr/batches", "services/eudr/certificates", "services/eudr/geodata"],
};

ensureDir(enterpriseRoot);
for (const relativeDir of sharedDirs) {
  ensureDir(path.join(enterpriseRoot, relativeDir));
}

for (const service of input.enabledServices) {
  for (const relativeDir of serviceDirs[service] ?? []) {
    ensureDir(path.join(enterpriseRoot, relativeDir));
  }
}

writeJson(path.join(enterpriseRoot, "enterprise.json"), {
  enterpriseId: input.enterpriseId,
  rootAddress: input.rootAddress ?? null,
  legalName: input.legalName,
  jurisdictionCode: input.jurisdictionCode,
  enabledServices: input.enabledServices,
  createdAt: new Date().toISOString(),
  status: input.rootAddress ? "linked-on-chain" : "provisioned-pending-root",
});

writeJson(path.join(enterpriseRoot, "evidence", "replication", "persistence-profile.json"), {
  policyVersion: "1.0.0",
  objective: "durable-verifiable-recoverable",
  enterpriseId: input.enterpriseId,
  rootAddress: input.rootAddress ?? null,
  requiredLayers: {
    operational: true,
    ipfs: true,
    filecoin: true,
    arweave: true,
    onChainAnchor: true,
  },
  minimumReplication: {
    ipfsPinningTargets: 2,
    filecoinReplicas: 2,
    arweaveWrites: 1,
    operationalCopies: 1,
  },
  repairPolicy: {
    reprovisionIpfsIfUnavailable: true,
    renewFilecoinDealsBeforeDaysRemaining: 30,
    rearchiveArweaveIfManifestMismatch: true,
  },
});

writeJson(path.join(enterpriseRoot, "evidence", "manifests", "README.manifest.json"), {
  note: "Place one canonical evidence manifest per evidence object in this directory.",
  schema: "sdk/schemas/evidence-manifest.schema.json",
  status: "placeholder",
});

console.log(JSON.stringify({ enterpriseRoot }, null, 2));
