import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const repoRoot = process.cwd();
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(path.join(repoRoot, ".env"));
  } catch {}
}
const chainConfig = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "infra", "chains", "anchors.config.json"), "utf8"),
);

const chainKey = process.env.CHAIN_KEY ?? chainConfig.execution.primaryChain;
const chain = chainConfig.chains[chainKey];

if (!chain) {
  throw new Error(`Unknown chain key: ${chainKey}`);
}

const rpcByChainKey = {
  "base-sepolia": process.env.RPC_URL_BASE_SEPOLIA,
  base: process.env.RPC_URL_BASE,
  "polygon-amoy": process.env.RPC_URL_POLYGON_AMOY,
  "polygon-pos": process.env.RPC_URL_POLYGON_POS,
  local: process.env.RPC_URL,
};

const plan = {
  planVersion: "1.0.0",
  planId: crypto.randomUUID(),
  createdAt: new Date().toISOString(),
  chainKey,
  chainId: Number(process.env.CHAIN_ID ?? 0),
  strategy: chainConfig.execution.strategy,
  rpcConfigured: Boolean(rpcByChainKey[chainKey]),
  actors: {
    deployer: process.env.SYMMETRY_DEPLOYER_WALLET ?? null,
    protocolAdmin: process.env.SYMMETRY_PROTOCOL_ADMIN_WALLET ?? null,
    upgradeAdminOwner: process.env.SYMMETRY_UPGRADE_ADMIN_OWNER ?? null,
    enterpriseOwner: process.env.TEST_ENTERPRISE_OWNER ?? null,
  },
  nextActions: [
    "Deploy shared factory and facets",
    "Record deployment artifact",
    "Deploy enterprise root",
    "Create corporate identity",
    "Install business services",
  ],
};

const outputDir = path.join(repoRoot, ".deployments", "plans", chainKey);
fs.mkdirSync(outputDir, { recursive: true });
const filePath = path.join(outputDir, `${plan.createdAt.replace(/[:.]/g, "-")}-deployment-plan.json`);
fs.writeFileSync(filePath, JSON.stringify(plan, null, 2));

console.log(JSON.stringify({ filePath, plan }, null, 2));
