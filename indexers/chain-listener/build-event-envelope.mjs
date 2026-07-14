import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(path.join(repoRoot, ".env"));
  } catch {}
}
const rawInput = process.argv[2];
if (!rawInput) {
  throw new Error("Pass a JSON event payload to normalize.");
}

const input = JSON.parse(rawInput);
const envelope = {
  chainKey: input.chainKey ?? process.env.CHAIN_KEY ?? "base-sepolia",
  rootAddress: input.rootAddress,
  eventName: input.eventName,
  blockNumber: input.blockNumber ?? null,
  txHash: input.txHash ?? null,
  decodedPayload: input.decodedPayload ?? {},
  ingestedAt: new Date().toISOString(),
};

const outputDir = path.join(repoRoot, "indexers", "chain-listener", "generated");
fs.mkdirSync(outputDir, { recursive: true });
const filePath = path.join(outputDir, `${Date.now()}-${envelope.eventName}.json`);
fs.writeFileSync(filePath, JSON.stringify(envelope, null, 2));
console.log(JSON.stringify({ filePath, envelope }, null, 2));
