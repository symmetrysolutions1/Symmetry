import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(path.join(repoRoot, ".env"));
  } catch {}
}

const tierArg = process.argv.find((arg) => arg.startsWith("--tier="));
const tier = tierArg?.split("=")[1] ?? process.env.READINESS_TIER ?? "local";
if (!new Set(["local", "testnet", "production"]).has(tier)) {
  throw new Error("READINESS_TIER must be local, testnet, or production.");
}

const chainConfig = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "infra", "chains", "anchors.config.json"), "utf8"),
);
const chainKey = process.env.CHAIN_KEY ?? (tier === "production" ? chainConfig.execution.primaryChain : "base-sepolia");
const selectedChain = chainConfig.chains[chainKey];
const checks = [];

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function configured(value) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return ![
    "replace-with-deployer-private-key",
    "your-key",
    "your-etherscan-compatible-api-key",
    "0x0000000000000000000000000000000000000000",
  ].some((placeholder) => normalized.includes(placeholder));
}

function validAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(value ?? "") && !/^0x0{40}$/i.test(value);
}

function addCheck(category, name, ok, detail, severity = "critical") {
  checks.push({ category, name, ok, severity, detail });
}

function collectJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(dir, entry.name))
    .sort();
}

const networkRequired = tier !== "local";
const productionRequired = tier === "production";
const rpcEnvByChain = {
  "base-sepolia": "RPC_URL_BASE_SEPOLIA",
  base: "RPC_URL_BASE",
  "polygon-amoy": "RPC_URL_POLYGON_AMOY",
  "polygon-pos": "RPC_URL_POLYGON_POS",
  local: "RPC_URL",
};

addCheck("profile", "readiness-tier", true, tier);
addCheck("profile", "known-chain", Boolean(selectedChain), selectedChain ? chainKey : `unsupported chain: ${chainKey}`);
if (selectedChain) {
  const expectedRole = productionRequired ? "primary-execution" : tier === "testnet" ? "testnet" : selectedChain.role;
  addCheck(
    "profile",
    "chain-role",
    !networkRequired || selectedChain.role === expectedRole || (tier === "testnet" && selectedChain.role === "secondary-testnet"),
    `role=${selectedChain.role}; expected=${expectedRole}`,
  );
  addCheck(
    "profile",
    "chain-id",
    !networkRequired || Number(process.env.CHAIN_ID) === selectedChain.chainId,
    `configured=${process.env.CHAIN_ID ?? "missing"}; expected=${selectedChain.chainId}`,
  );
}

const requiredEnv = [
  "CHAIN_KEY",
  "CHAIN_ID",
  "PRIVATE_KEY_DEPLOYER",
  "SYMMETRY_DEPLOYER_WALLET",
  "SYMMETRY_PROTOCOL_ADMIN_WALLET",
  "SYMMETRY_UPGRADE_ADMIN_OWNER",
  "FACTORY_ADDRESS",
];
for (const key of requiredEnv) {
  addCheck(
    "config",
    `env:${key}`,
    !networkRequired || configured(process.env[key]),
    configured(process.env[key]) ? "configured" : networkRequired ? "missing or placeholder" : "not required for local tier",
  );
}

for (const key of ["SYMMETRY_DEPLOYER_WALLET", "SYMMETRY_PROTOCOL_ADMIN_WALLET", "SYMMETRY_UPGRADE_ADMIN_OWNER", "FACTORY_ADDRESS"]) {
  addCheck(
    "config",
    `address:${key}`,
    !networkRequired || validAddress(process.env[key]),
    validAddress(process.env[key]) ? "valid non-zero address" : networkRequired ? "invalid address" : "not required for local tier",
  );
}

const rpcEnvKey = rpcEnvByChain[chainKey];
addCheck(
  "config",
  `rpc:${chainKey}`,
  !networkRequired || Boolean(rpcEnvKey && configured(process.env[rpcEnvKey])),
  rpcEnvKey && configured(process.env[rpcEnvKey]) ? `${rpcEnvKey} configured` : networkRequired ? "missing" : "not required",
);

addCheck("repo", "env-example", exists(".env.example"), "environment contract");
addCheck("repo", "chain-config", exists("infra/chains/anchors.config.json"), "chain abstraction config");
addCheck("repo", "artifact-schema", exists("infra/deployments/artifacts.schema.json"), "deployment schema");
addCheck("repo", "monitoring-alerts", exists("infra/monitoring/alerts.policy.json"), "monitoring alert catalog");
addCheck("repo", "evidence-schema", exists("sdk/schemas/evidence-manifest.schema.json"), "evidence manifest schema");
addCheck("security", "factory-access-tests", exists("tests/foundry/EnterpriseRootFactoryFlow.t.sol"), "provisioner and handoff coverage");
addCheck("security", "dual-upgrade-tests", exists("tests/foundry/UpgradeGovernanceFlow.t.sol"), "dual-control upgrade coverage");
addCheck("validation", "votoid-tests", exists("tests/foundry/VotoIDFlow.t.sol"), "VotoID flow");
addCheck("validation", "automation-tests", exists("tests/foundry/AutomationFlow.t.sol"), "Automation flow");
addCheck("validation", "eudr-tests", exists("tests/foundry/EUDRFlow.t.sol"), "EUDR flow");

const recordsDir = path.join(repoRoot, ".deployments", "records", chainKey);
const records = collectJsonFiles(recordsDir);
const parsedRecords = records.map((filePath) => ({
  filePath,
  artifact: JSON.parse(fs.readFileSync(filePath, "utf8")),
}));
const latestFactoryRecord = parsedRecords.filter(({ artifact }) => artifact.deploymentKind === "factory").at(-1);
const latestRootRecord = parsedRecords.filter(({ artifact }) => artifact.deploymentKind === "enterprise-root").at(-1);
addCheck(
  "deployments",
  `factory-artifact:${chainKey}`,
  !networkRequired || Boolean(latestFactoryRecord),
  latestFactoryRecord ? path.relative(repoRoot, latestFactoryRecord.filePath) : networkRequired ? "missing" : "not required",
);
if (latestFactoryRecord) {
  const artifact = latestFactoryRecord.artifact;
  const allowedStatuses = productionRequired ? ["verified"] : ["broadcasted", "verified"];
  addCheck("deployments", "factory-artifact-status", !networkRequired || allowedStatuses.includes(artifact.status), `status=${artifact.status}`);
  addCheck("deployments", "factory-artifact-contracts", !networkRequired || (Array.isArray(artifact.contracts) && artifact.contracts.length >= 14), `contracts=${artifact.contracts?.length ?? 0}; expected>=14`);
  addCheck(
    "deployments",
    "factory-security-release",
    !networkRequired || artifact.protocolRelease === "0.2.0-security-hardened",
    `release=${artifact.protocolRelease ?? "legacy"}`,
  );
}
addCheck(
  "deployments",
  "enterprise-root-artifact",
  !productionRequired || Boolean(latestRootRecord),
  latestRootRecord ? path.relative(repoRoot, latestRootRecord.filePath) : productionRequired ? "required" : "created after factory deployment",
  productionRequired ? "critical" : "warning",
);

addCheck("operations", "onboarding-runbook", exists("docs/runbooks/enterprise-onboarding-e2e.md"), "present");
addCheck("operations", "enterprise-provision-script", exists("scripts/ops/provision-enterprise-root.mjs"), "present");
addCheck("operations", "production-gate-runbook", exists("docs/runbooks/production-readiness-gate.md"), "present");
addCheck("operations", "live-network-check", exists("scripts/ops/check-live-deployment.mjs"), "present");
addCheck("operations", "evidence-health-script", exists("services/evidence-normalizer/check-evidence-health.mjs"), "present");
addCheck("operations", "evidence-canonicalizer", exists("services/evidence-normalizer/canonical-evidence.mjs"), "present");
addCheck("operations", "evidence-prepare-script", exists("services/evidence-normalizer/prepare-evidence-anchor.mjs"), "present");
addCheck("operations", "evidence-finalize-script", exists("services/evidence-normalizer/finalize-evidence-manifest.mjs"), "present");
addCheck("operations", "evidence-canonical-tests", exists("tests/canonical-evidence.test.mjs"), "present");
addCheck("operations", "confirmed-chain-listener", exists("indexers/chain-listener/poll-chain-events.mjs"), "present");

const productionEnv = [
  "DEPLOYER_KEY_ROTATED",
  "EVIDENCE_HEALTH_MANIFEST",
  "IPFS_GATEWAY_URL",
  "FILECOIN_DEAL_STATUS_URL_TEMPLATE",
  "ARWEAVE_GATEWAY_URL",
];
for (const key of productionEnv) {
  const ok = key === "DEPLOYER_KEY_ROTATED" ? process.env[key] === "true" : configured(process.env[key]);
  addCheck("production", `env:${key}`, !productionRequired || ok, ok ? "configured" : productionRequired ? "required" : "not required", "critical");
}

const failedCritical = checks.filter((check) => !check.ok && check.severity === "critical");
const failedWarnings = checks.filter((check) => !check.ok && check.severity !== "critical");
console.log(JSON.stringify({
  ready: failedCritical.length === 0,
  tier,
  chainKey,
  nextCommand: networkRequired ? `node scripts/ops/check-live-deployment.mjs --tier=${tier}` : null,
  summary: {
    total: checks.length,
    passed: checks.filter((check) => check.ok).length,
    failedCritical: failedCritical.length,
    failedWarnings: failedWarnings.length,
  },
  checks,
}, null, 2));
process.exit(failedCritical.length === 0 ? 0 : 1);
