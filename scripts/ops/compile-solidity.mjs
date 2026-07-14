import fs from "node:fs";
import path from "node:path";
import solc from "solc";

const repoRoot = process.cwd();
// This check targets deployable protocol code. Foundry separately compiles scripts and tests.
const sourceDirs = ["contracts"];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".sol")) {
      files.push(fullPath);
    }
  }

  return files;
}

const sources = {};
for (const relativeDir of sourceDirs) {
  const absoluteDir = path.join(repoRoot, relativeDir);
  if (!fs.existsSync(absoluteDir)) continue;

  for (const file of walk(absoluteDir)) {
    const normalized = path.relative(repoRoot, file).replaceAll("\\", "/");
    sources[normalized] = {
      content: fs.readFileSync(file, "utf8"),
    };
  }
}

const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"]
      }
    }
  }
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
const diagnostics = [...(output.errors ?? [])];
const errors = diagnostics.filter((item) => item.severity === "error");

for (const item of diagnostics) {
  const prefix = item.severity === "error" ? "ERROR" : "WARN";
  console.log(`${prefix}: ${item.formattedMessage}`);
}

if (errors.length > 0) {
  process.exit(1);
}

const fileCount = Object.keys(sources).length;
const contractCount = Object.values(output.contracts ?? {}).reduce(
  (total, fileContracts) => total + Object.keys(fileContracts).length,
  0,
);

console.log(`Compiled ${fileCount} Solidity files and ${contractCount} contracts successfully.`);
