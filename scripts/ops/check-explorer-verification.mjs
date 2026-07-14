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
const requestIntervalMs = Number(process.env.EXPLORER_CHECK_INTERVAL_MS ?? 400);
const maxAttempts = Number(process.env.EXPLORER_CHECK_MAX_ATTEMPTS ?? 5);

if (!Number.isFinite(requestIntervalMs) || requestIntervalMs < 0) {
  throw new Error("EXPLORER_CHECK_INTERVAL_MS must be zero or positive.");
}
if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
  throw new Error("EXPLORER_CHECK_MAX_ATTEMPTS must be a positive integer.");
}

function sleep(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

function transientExplorerFailure(response, payload, error) {
  if (error?.name === "TimeoutError" || error?.name === "AbortError") return true;
  if (error instanceof TypeError) return true;
  if (response?.status === 429 || response?.status >= 500) return true;
  return /rate limit|max calls|too many|temporar|timeout|busy|connection|fetch failed/i
    .test(payload?.result ?? error?.message ?? "");
}

async function sourcePublished(chainId, address) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let response;
    let payload;
    try {
      const url = new URL("https://api.etherscan.io/v2/api");
      url.searchParams.set("chainid", String(chainId));
      url.searchParams.set("module", "contract");
      url.searchParams.set("action", "getsourcecode");
      url.searchParams.set("address", address);
      url.searchParams.set("apikey", apiKey);
      response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      payload = await response.json();
      if (response.ok && payload.status === "1") {
        return Boolean(payload.result?.[0]?.SourceCode);
      }
      if (!transientExplorerFailure(response, payload)) return false;
    } catch (error) {
      if (!transientExplorerFailure(response, payload, error)) throw error;
      if (attempt === maxAttempts) throw error;
    }

    if (attempt === maxAttempts) {
      throw new Error(`Explorer API retries exhausted for ${address}.`);
    }
    await sleep(500 * (2 ** (attempt - 1)));
  }

  return false;
}

const results = [];
for (const [index, contract] of (artifact.contracts ?? []).entries()) {
  const verified = await sourcePublished(artifact.chainId, contract.address);
  results.push({ name: contract.name, address: contract.address, verified });
  if (index < artifact.contracts.length - 1) await sleep(requestIntervalMs);
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
