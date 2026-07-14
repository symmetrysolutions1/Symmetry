import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";

const repoRoot = process.cwd();
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(path.join(repoRoot, ".env"));
  } catch {}
}
const rawInput = process.argv[2];

if (!rawInput) {
  throw new Error("Pass a JSON payload describing the deployment artifact.");
}

const payload = JSON.parse(rawInput);
const chainKey = payload.chainKey ?? process.env.CHAIN_KEY ?? "base-sepolia";
const outputDir = path.join(repoRoot, ".deployments", "records", chainKey);
fs.mkdirSync(outputDir, { recursive: true });

const filenameBase = `${new Date().toISOString().replace(/[:.]/g, "-")}-${payload.deploymentKind ?? "deployment"}.json`;
const filePath = path.join(outputDir, filenameBase);

const artifact = {
  artifactVersion: "1.0.0",
  status: "planned",
  ...payload,
};

fs.writeFileSync(filePath, JSON.stringify(artifact, null, 2));
const validatorPath = path.join(repoRoot, "scripts", "ops", "validate-deployment-artifact.mjs");
const validation = spawnSync(process.execPath, [validatorPath, filePath], {
  cwd: repoRoot,
  encoding: "utf8",
});

if (validation.status !== 0) {
  fs.unlinkSync(filePath);
  throw new Error(validation.stderr || validation.stdout || "Deployment artifact validation failed.");
}

console.log(JSON.stringify({ filePath, artifact }, null, 2));
