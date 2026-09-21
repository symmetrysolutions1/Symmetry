import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(path.join(repoRoot, ".env"));
  } catch {}
}

const phaseArg = process.argv.find((arg) => arg.startsWith("--phase="));
const phase = phaseArg?.split("=")[1] ?? "predeploy";
if (!new Set(["predeploy", "postdeploy"]).has(phase)) {
  throw new Error("Use --phase=predeploy or --phase=postdeploy.");
}

const rpcUrl = process.env.RPC_URL_HSK_TESTNET ?? "https://testnet.hsk.xyz";
const expectedChainId = 133;
const deployer = process.env.SYMMETRY_DEPLOYER_WALLET ?? process.env.AUREO_DEPLOYER_WALLET;
const contract = process.env.AUREO_CONTRACT_ADDRESS;
const checks = [];

function validAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(value ?? "") && !/^0x0{40}$/i.test(value);
}

function add(name, ok, detail, severity = "critical") {
  checks.push({ name, ok, detail, severity });
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

try {
  const chainId = Number.parseInt(await rpc("eth_chainId"), 16);
  add("rpc-chain-id", chainId === expectedChainId, `actual=${chainId}; expected=${expectedChainId}`);

  add(
    "deployer-address",
    validAddress(deployer),
    validAddress(deployer) ? "valid public address" : "missing or invalid public address",
  );

  if (validAddress(deployer)) {
    const balanceWei = BigInt(await rpc("eth_getBalance", [deployer, "latest"]));
    add("deployer-funded", balanceWei > 0n, `balanceWei=${balanceWei}`);
  }

  if (phase === "postdeploy") {
    add(
      "aureo-contract-address",
      validAddress(contract),
      validAddress(contract) ? "valid public contract address" : "missing or invalid AUREO_CONTRACT_ADDRESS",
    );
    if (validAddress(contract)) {
      const code = await rpc("eth_getCode", [contract, "latest"]);
      add("aureo-contract-code", code !== "0x", code !== "0x" ? "contract bytecode found" : "no bytecode at address");
    }
  } else {
    add("aureo-contract-address", true, "not required before deployment", "warning");
  }
} catch (error) {
  add("rpc-connectivity", false, error instanceof Error ? error.message : String(error));
}

const failedCritical = checks.filter((check) => !check.ok && check.severity === "critical");
console.log(JSON.stringify({
  ready: failedCritical.length === 0,
  phase,
  chain: "hsk-testnet",
  chainId: expectedChainId,
  explorer: process.env.AUREO_EXPLORER_URL ?? "https://testnet-explorer.hskchain.net",
  checks,
}, null, 2));
process.exit(failedCritical.length === 0 ? 0 : 1);
