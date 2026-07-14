import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(path.join(repoRoot, ".env"));
  } catch {}
}

const chainId = Number(process.env.CHAIN_ID);
const chainKey = process.env.CHAIN_KEY;
const broadcastPath = process.argv[2] ?? path.join(
  repoRoot,
  "broadcast",
  "DeployEnterpriseRootFactory.s.sol",
  String(chainId),
  "run-latest.json",
);
if (!chainKey || !Number.isInteger(chainId) || !fs.existsSync(broadcastPath)) {
  throw new Error("CHAIN_KEY, CHAIN_ID, and a valid factory broadcast are required.");
}

const broadcast = JSON.parse(fs.readFileSync(broadcastPath, "utf8"));
const contracts = (broadcast.transactions ?? [])
  .filter((transaction) => transaction.contractName && transaction.contractAddress)
  .map((transaction) => ({
    name: transaction.contractName,
    address: transaction.contractAddress,
    txHash: transaction.hash ?? null,
  }));
const factory = contracts.find((contract) => contract.name === "EnterpriseRootFactory");
if (!factory) throw new Error("EnterpriseRootFactory was not found in the broadcast.");

const zeroAddress = "0x0000000000000000000000000000000000000000";
const artifact = {
  artifactVersion: "1.1.0",
  protocolRelease: "0.2.0-security-hardened",
  deploymentKind: "factory",
  chainKey,
  chainId,
  deployedAt: new Date().toISOString(),
  deployedBy: process.env.SYMMETRY_DEPLOYER_WALLET,
  companyKey: null,
  enterpriseRoot: null,
  localEnterpriseId: null,
  contracts,
  ownership: {
    protocolAdmin: process.env.SYMMETRY_PROTOCOL_ADMIN_WALLET,
    upgradeAdmin: process.env.SYMMETRY_UPGRADE_ADMIN_OWNER,
    enterpriseOwner: process.env.TEST_ENTERPRISE_OWNER ?? zeroAddress,
    factoryOwner: process.env.SYMMETRY_PROTOCOL_ADMIN_WALLET,
    initialProvisioner: process.env.SYMMETRY_DEPLOYER_WALLET,
  },
  services: [],
  status: "broadcasted",
  verification: {
    explorer: "pending",
    checkedAt: null,
  },
  sourceBroadcast: path.relative(repoRoot, broadcastPath),
  notes: [
    "Permissioned provisioning and two-step factory ownership enabled.",
    "Enterprise root upgrades require upgrade-admin approval and enterprise-owner execution.",
  ],
};

const outputDir = path.join(repoRoot, ".deployments", "records", chainKey);
fs.mkdirSync(outputDir, { recursive: true });
const outputPath = path.join(
  outputDir,
  `${new Date().toISOString().replace(/[:.]/g, "-")}-factory-v0.2.0.json`,
);
fs.writeFileSync(outputPath, JSON.stringify(artifact, null, 2));

const validation = spawnSync(
  process.execPath,
  [path.join(repoRoot, "scripts", "ops", "validate-deployment-artifact.mjs"), outputPath],
  { cwd: repoRoot, encoding: "utf8" },
);
if (validation.status !== 0) {
  fs.unlinkSync(outputPath);
  throw new Error(validation.stderr || validation.stdout || "Artifact validation failed.");
}

console.log(JSON.stringify({ outputPath, factoryAddress: factory.address, contractCount: contracts.length }, null, 2));
