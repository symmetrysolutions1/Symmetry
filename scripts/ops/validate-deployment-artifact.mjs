import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const schemaPath = path.join(repoRoot, "infra", "deployments", "artifacts.schema.json");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

function fail(message) {
  console.error(message);
  process.exit(1);
}

function ensure(condition, message, findings) {
  if (!condition) findings.push(message);
}

const input = process.argv[2];
if (!input) {
  fail("Pass a JSON file path or a raw JSON string to validate.");
}

const artifact = fs.existsSync(input) ? JSON.parse(fs.readFileSync(input, "utf8")) : JSON.parse(input);
const findings = [];
const requiredFields = schema.required ?? [];

for (const field of requiredFields) {
  ensure(artifact[field] !== undefined && artifact[field] !== null, `Missing required field: ${field}`, findings);
}

ensure(
  typeof artifact.chainId === "number" && Number.isInteger(artifact.chainId) && artifact.chainId > 0,
  "chainId must be a positive integer",
  findings,
);
ensure(Array.isArray(artifact.contracts) && artifact.contracts.length > 0, "contracts must be a non-empty array", findings);
ensure(typeof artifact.ownership === "object" && artifact.ownership !== null, "ownership must be present", findings);
ensure(
  ["factory", "enterprise-root", "service-installation"].includes(artifact.deploymentKind),
  "deploymentKind must be factory, enterprise-root, or service-installation",
  findings,
);
ensure(
  ["planned", "broadcasted", "verified", "failed"].includes(artifact.status),
  "status must be planned, broadcasted, verified, or failed",
  findings,
);

if (Array.isArray(artifact.contracts)) {
  artifact.contracts.forEach((contract, index) => {
    ensure(typeof contract.name === "string" && contract.name.length > 0, `contracts[${index}].name is required`, findings);
    ensure(
      typeof contract.address === "string" && /^0x[a-fA-F0-9]{40}$/.test(contract.address),
      `contracts[${index}].address must be a valid EVM address`,
      findings,
    );
  });
}

if (artifact.enterpriseRoot !== null && artifact.enterpriseRoot !== undefined) {
  ensure(
    typeof artifact.enterpriseRoot === "string" && /^0x[a-fA-F0-9]{40}$/.test(artifact.enterpriseRoot),
    "enterpriseRoot must be a valid EVM address when present",
    findings,
  );
}

if (artifact.ownership) {
  for (const key of ["protocolAdmin", "upgradeAdmin", "enterpriseOwner"]) {
    ensure(
      typeof artifact.ownership[key] === "string" && /^0x[a-fA-F0-9]{40}$/.test(artifact.ownership[key]),
      `ownership.${key} must be a valid EVM address`,
      findings,
    );
  }
}

if (findings.length > 0) {
  console.error(JSON.stringify({ valid: false, findings }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ valid: true, artifact }, null, 2));
