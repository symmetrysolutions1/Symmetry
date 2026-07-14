import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(path.join(repoRoot, ".env"));
  } catch {}
}

const chainKey = process.env.CHAIN_KEY ?? "base-sepolia";
const rpcByChain = {
  "base-sepolia": process.env.RPC_URL_BASE_SEPOLIA,
  base: process.env.RPC_URL_BASE,
  "polygon-amoy": process.env.RPC_URL_POLYGON_AMOY,
  "polygon-pos": process.env.RPC_URL_POLYGON_POS,
};
const rpcUrl = rpcByChain[chainKey] ?? process.env.RPC_URL;
const confirmations = Number(process.env.INDEXER_CONFIRMATIONS ?? 12);
const chunkSize = Number(process.env.INDEXER_BLOCK_CHUNK ?? 1_000);
const pollIntervalMs = Number(process.env.INDEXER_POLL_INTERVAL_MS ?? 10_000);
const once = process.argv.includes("--once");
const runtimeDir = path.join(repoRoot, ".runtime", "chain-listener", chainKey);
const checkpointPath = path.join(runtimeDir, "checkpoint.json");
const eventsPath = path.join(runtimeDir, "events.jsonl");

const addresses = [
  process.env.FACTORY_ADDRESS,
  ...(process.env.INDEXER_ROOT_ADDRESSES ?? "").split(","),
]
  .map((value) => value?.trim())
  .filter((value) => /^0x[a-fA-F0-9]{40}$/.test(value ?? ""));

if (!rpcUrl) throw new Error(`RPC URL missing for ${chainKey}`);
if (addresses.length === 0) throw new Error("Configure FACTORY_ADDRESS or INDEXER_ROOT_ADDRESSES.");
if (!Number.isInteger(confirmations) || confirmations < 1) throw new Error("INDEXER_CONFIRMATIONS must be positive.");

fs.mkdirSync(runtimeDir, { recursive: true });

async function rpc(method, params = []) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(20_000),
  });
  const responseText = await response.text();
  let payload;
  try {
    payload = JSON.parse(responseText);
  } catch {
    throw new Error(`RPC ${method} returned invalid JSON (HTTP ${response.status})`);
  }
  if (!response.ok || payload.error) {
    const error = new Error(payload.error?.message ?? `RPC ${method} HTTP ${response.status}`);
    error.rpcCode = payload.error?.code;
    error.httpStatus = response.status;
    throw error;
  }
  return payload.result;
}

function providerLogRange(error) {
  if (error?.rpcCode !== -32600) return null;
  const match = error.message.match(/up to (?:a )?(\d+) block range/i);
  return match ? Number(match[1]) : null;
}

function toHex(blockNumber) {
  return `0x${blockNumber.toString(16)}`;
}

function loadCheckpoint() {
  if (!fs.existsSync(checkpointPath)) return null;
  return JSON.parse(fs.readFileSync(checkpointPath, "utf8"));
}

async function assertCheckpointCanonical(checkpoint) {
  if (!checkpoint?.blockNumber || !checkpoint?.blockHash) return;
  const block = await rpc("eth_getBlockByNumber", [toHex(checkpoint.blockNumber), false]);
  if (!block || block.hash !== checkpoint.blockHash) {
    throw new Error(`Reorg detected at block ${checkpoint.blockNumber}; rewind checkpoint before resuming.`);
  }
}

async function persistCheckpoint(blockNumber) {
  const block = await rpc("eth_getBlockByNumber", [toHex(blockNumber), false]);
  const checkpoint = {
    chainKey,
    blockNumber,
    blockHash: block.hash,
    confirmations,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));
}

async function pollOnce() {
  const latest = Number.parseInt(await rpc("eth_blockNumber"), 16);
  const safeHead = latest - confirmations;
  if (safeHead < 0) return { latest, safeHead, indexed: 0 };

  const checkpoint = loadCheckpoint();
  await assertCheckpointCanonical(checkpoint);
  let fromBlock = checkpoint
    ? checkpoint.blockNumber + 1
    : Number(process.env.INDEXER_START_BLOCK ?? safeHead);
  let indexed = 0;
  let effectiveChunkSize = chunkSize;

  while (fromBlock <= safeHead) {
    const toBlock = Math.min(fromBlock + effectiveChunkSize - 1, safeHead);
    let logs;
    try {
      logs = await rpc("eth_getLogs", [{
        address: addresses,
        fromBlock: toHex(fromBlock),
        toBlock: toHex(toBlock),
      }]);
    } catch (error) {
      const providerRange = providerLogRange(error);
      if (providerRange && effectiveChunkSize > providerRange) {
        effectiveChunkSize = providerRange;
        continue;
      }
      throw error;
    }

    logs.sort((left, right) =>
      Number.parseInt(left.blockNumber, 16) - Number.parseInt(right.blockNumber, 16) ||
      Number.parseInt(left.logIndex, 16) - Number.parseInt(right.logIndex, 16)
    );
    for (const log of logs) {
      const envelope = {
        chainKey,
        address: log.address,
        blockNumber: Number.parseInt(log.blockNumber, 16),
        blockHash: log.blockHash,
        transactionHash: log.transactionHash,
        transactionIndex: Number.parseInt(log.transactionIndex, 16),
        logIndex: Number.parseInt(log.logIndex, 16),
        topic0: log.topics[0] ?? null,
        topics: log.topics,
        data: log.data,
        removed: Boolean(log.removed),
        ingestedAt: new Date().toISOString(),
      };
      fs.appendFileSync(eventsPath, `${JSON.stringify(envelope)}\n`);
      indexed++;
    }

    await persistCheckpoint(toBlock);
    fromBlock = toBlock + 1;
  }

  return {
    latest,
    safeHead,
    indexed,
    configuredChunkSize: chunkSize,
    effectiveChunkSize,
    checkpointPath,
    eventsPath,
    addresses,
  };
}

do {
  const result = await pollOnce();
  console.log(JSON.stringify({ healthy: true, ...result }, null, 2));
  if (once) break;
  await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
} while (true);
