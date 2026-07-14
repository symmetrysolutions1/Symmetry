import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(path.join(repoRoot, ".env"));
  } catch {}
}

const tierArg = process.argv.find((arg) => arg.startsWith("--tier="));
const tier = tierArg?.split("=")[1] ?? process.env.READINESS_TIER ?? "testnet";
const production = tier === "production";
const chainKey = process.env.CHAIN_KEY ?? (production ? "base" : "base-sepolia");
const rpcByChain = {
  "base-sepolia": process.env.RPC_URL_BASE_SEPOLIA,
  base: process.env.RPC_URL_BASE,
  "polygon-amoy": process.env.RPC_URL_POLYGON_AMOY,
  "polygon-pos": process.env.RPC_URL_POLYGON_POS,
};
const expectedChainIds = { "base-sepolia": 84532, base: 8453, "polygon-amoy": 80002, "polygon-pos": 137 };
const rpcUrl = rpcByChain[chainKey];
const checks = [];

function add(name, ok, detail, severity = "critical") {
  checks.push({ name, ok, detail, severity });
}

function validAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(value ?? "") && !/^0x0{40}$/i.test(value);
}

function addressFromWord(value) {
  if (!value || value === "0x") return null;
  return `0x${value.slice(-40)}`.toLowerCase();
}

function encodeAddress(address) {
  return address.slice(2).toLowerCase().padStart(64, "0");
}

async function rpc(method, params = []) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.error) throw new Error(payload.error.message ?? "RPC error");
  return payload.result;
}

async function codeAt(label, address, requireContract = true) {
  if (!validAddress(address)) {
    add(label, false, "invalid or missing address");
    return false;
  }
  const code = await rpc("eth_getCode", [address, "latest"]);
  const isContract = code !== "0x";
  add(label, requireContract ? isContract : true, isContract ? "contract" : "EOA", requireContract ? "critical" : "warning");
  return isContract;
}

async function explorerVerified(label, address) {
  const apiKey = process.env.ETHERSCAN_API_KEY ?? process.env.BASESCAN_API_KEY;
  if (!apiKey || !validAddress(address)) {
    add(label, false, "missing API key or address");
    return;
  }
  const url = new URL("https://api.etherscan.io/v2/api");
  url.searchParams.set("chainid", String(expectedChainIds[chainKey]));
  url.searchParams.set("module", "contract");
  url.searchParams.set("action", "getsourcecode");
  url.searchParams.set("address", address);
  url.searchParams.set("apikey", apiKey);
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  const payload = await response.json();
  const verified = payload.status === "1" && Boolean(payload.result?.[0]?.SourceCode);
  add(label, verified, verified ? "source published" : "source not verified");
}

if (!rpcUrl) {
  console.error(JSON.stringify({ ready: false, tier, chainKey, error: "RPC URL missing" }, null, 2));
  process.exit(1);
}

try {
  const chainId = Number.parseInt(await rpc("eth_chainId"), 16);
  add("rpc-chain-id", chainId === expectedChainIds[chainKey], `actual=${chainId}; expected=${expectedChainIds[chainKey]}`);

  const factory = process.env.FACTORY_ADDRESS;
  await codeAt("factory-code", factory, true);
  await codeAt("protocol-admin-multisig", process.env.SYMMETRY_PROTOCOL_ADMIN_WALLET, production);
  await codeAt("upgrade-admin-multisig", process.env.SYMMETRY_UPGRADE_ADMIN_OWNER, production);
  if (process.env.TEST_ENTERPRISE_OWNER) {
    await codeAt("enterprise-owner-multisig", process.env.TEST_ENTERPRISE_OWNER, production);
  }

  if (validAddress(factory)) {
    try {
      const factoryOwnerRaw = await rpc("eth_call", [{ to: factory, data: "0x8da5cb5b" }, "latest"]);
      const factoryOwner = addressFromWord(factoryOwnerRaw);
      const expectedOwner = process.env.SYMMETRY_PROTOCOL_ADMIN_WALLET?.toLowerCase();
      add("factory-owner", factoryOwner === expectedOwner, `actual=${factoryOwner}; expected=${expectedOwner}`);

      const deployer = process.env.SYMMETRY_DEPLOYER_WALLET;
      if (validAddress(deployer)) {
        const provisionerRaw = await rpc("eth_call", [{ to: factory, data: `0xa02aaa70${encodeAddress(deployer)}` }, "latest"]);
        add("deployer-is-provisioner", BigInt(provisionerRaw) === 1n, `authorized=${BigInt(provisionerRaw) === 1n}`);
        const balance = BigInt(await rpc("eth_getBalance", [deployer, "latest"]));
        add("deployer-funded", balance > 0n, `balanceWei=${balance}`);
      }
    } catch (error) {
      add("factory-security-interface", false, `legacy or incompatible factory: ${error.message}`);
    }
    await explorerVerified("factory-explorer-verification", factory);
  }

  const root = process.env.ENTERPRISE_ROOT_ADDRESS ?? process.env.VOTOID_E2E_ROOT_ADDRESS;
  if (validAddress(root)) {
    await codeAt("enterprise-root-code", root, true);
    const rootOwnerRaw = await rpc("eth_call", [{ to: root, data: "0x8da5cb5b" }, "latest"]);
    const rootOwner = addressFromWord(rootOwnerRaw);
    const expectedRootOwner = (process.env.ENTERPRISE_OWNER_ADDRESS ?? process.env.TEST_ENTERPRISE_OWNER)?.toLowerCase();
    add("enterprise-root-owner", !expectedRootOwner || rootOwner === expectedRootOwner, `actual=${rootOwner}; expected=${expectedRootOwner ?? "not configured"}`);

    const governanceRaw = await rpc("eth_call", [{ to: root, data: "0xd4401c68" }, "latest"]);
    const upgradeAdmin = governanceRaw?.length >= 66 ? addressFromWord(`0x${governanceRaw.slice(2, 66)}`) : null;
    add("enterprise-root-upgrade-governance", upgradeAdmin === process.env.SYMMETRY_UPGRADE_ADMIN_OWNER?.toLowerCase(), `actual=${upgradeAdmin}`);
    await explorerVerified("enterprise-root-explorer-verification", root);
  } else {
    add("enterprise-root-configured", !production, production ? "required in production" : "optional for factory-only testnet check", production ? "critical" : "warning");
  }

  if (production) {
    const manifestPath = process.env.EVIDENCE_HEALTH_MANIFEST;
    if (!manifestPath || !fs.existsSync(path.resolve(repoRoot, manifestPath))) {
      add("evidence-live-health", false, "production evidence manifest missing");
    } else {
      const evidenceCheck = spawnSync(
        process.execPath,
        [path.join(repoRoot, "services", "evidence-normalizer", "check-evidence-health.mjs"), manifestPath, "--live"],
        { cwd: repoRoot, encoding: "utf8", env: process.env },
      );
      add(
        "evidence-live-health",
        evidenceCheck.status === 0,
        evidenceCheck.status === 0 ? "all persistence layers verified" : "one or more persistence layers failed",
      );
    }
  }
} catch (error) {
  add("live-check-execution", false, error.message);
}

const failures = checks.filter((check) => !check.ok && check.severity === "critical");
console.log(JSON.stringify({ ready: failures.length === 0, tier, chainKey, checks }, null, 2));
process.exit(failures.length === 0 ? 0 : 1);
