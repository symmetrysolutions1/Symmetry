import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(path.join(repoRoot, ".env"));
  } catch {}
}

const artifactPath = process.argv.find((argument) => !argument.startsWith("--") && argument.endsWith(".json"));
const write = process.argv.includes("--write");
if (!artifactPath || !fs.existsSync(artifactPath)) throw new Error("Pass a deployment artifact JSON path.");

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const apiKey = process.env.ETHERSCAN_API_KEY ?? process.env.BASESCAN_API_KEY;
if (!apiKey) throw new Error("Configure ETHERSCAN_API_KEY or BASESCAN_API_KEY.");

const results = [];
for (const contract of artifact.contracts ?? []) {
  const url = new URL("https://api.etherscan.io/v2/api");
  url.searchParams.set("chainid", String(artifact.chainId));
  url.searchParams.set("module", "contract");
  url.searchParams.set("action", "getsourcecode");
  url.searchParams.set("address", contract.address);
  url.searchParams.set("apikey", apiKey);
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  const payload = await response.json();
  const verified = payload.status === "1" && Boolean(payload.result?.[0]?.SourceCode);
  results.push({ name: contract.name, address: contract.address, verified });
}

const allVerified = results.length > 0 && results.every((result) => result.verified);
if (write) {
  artifact.status = allVerified ? "verified" : "broadcasted";
  artifact.verification = {
    explorer: allVerified ? "verified" : "partial",
    checkedAt: new Date().toISOString(),
    contracts: results,
  };
  fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));
}

console.log(JSON.stringify({ allVerified, artifactPath, results }, null, 2));
process.exit(allVerified ? 0 : 1);
