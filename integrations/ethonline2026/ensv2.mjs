import sha3 from "js-sha3";

const { keccak256 } = sha3;

export const ENSV2_SEPOLIA_CHAIN_ID = 11155111;
export const ROLE_SET_TEXT = 1n << 4n;
export const ROLE_SET_DATA = 1n << 36n;

const HEX = /^[0-9a-f]+$/i;

function hashBytes(value) {
  return `0x${keccak256(value)}`;
}

function bytes32(value) {
  const normalized = value.replace(/^0x/, "");
  if (normalized.length !== 64 || !HEX.test(normalized)) {
    throw new Error("Expected a 32-byte hex value");
  }
  return `0x${normalized.toLowerCase()}`;
}

export function labelhash(label) {
  if (!label || label.includes(".")) throw new Error("label must be a single non-empty DNS label");
  return hashBytes(label);
}

export function namehash(name) {
  if (!name) return `0x${"00".repeat(32)}`;
  const labels = name.toLowerCase().replace(/\.$/, "").split(".").filter(Boolean);
  let node = Buffer.alloc(32);
  for (let index = labels.length - 1; index >= 0; index -= 1) {
    node = Buffer.from(keccak256(Buffer.concat([node, Buffer.from(labelhash(labels[index]).slice(2), "hex")])) , "hex");
  }
  return `0x${node.toString("hex")}`;
}

export function dnsEncode(name) {
  const labels = name.toLowerCase().replace(/\.$/, "").split(".").filter(Boolean);
  const encoded = [];
  for (const label of labels) {
    const bytes = Buffer.from(label, "utf8");
    if (bytes.length > 63) throw new Error("DNS label is longer than 63 bytes");
    encoded.push(bytes.length, ...bytes);
  }
  encoded.push(0);
  return `0x${Buffer.from(encoded).toString("hex")}`;
}

export function buildEnsNamespacePlan({ rootName, territoryRef, workspaceId, operator }) {
  if (!rootName?.endsWith(".eth")) throw new Error("rootName must be an ENS .eth name");
  if (!territoryRef?.trim()) throw new Error("territoryRef is required");
  if (!operator) throw new Error("operator is required");
  const normalizedWorkspaceId = bytes32(workspaceId);
  const slug = territoryRef.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  if (!slug) throw new Error("territoryRef does not produce an ENS-safe label");
  const fullName = `${slug}.${rootName.toLowerCase()}`;
  const node = namehash(fullName);
  return {
    chainId: ENSV2_SEPOLIA_CHAIN_ID,
    workspaceId: normalizedWorkspaceId,
    fullName,
    node,
    dnsName: dnsEncode(fullName),
    operator,
    roles: { setText: ROLE_SET_TEXT.toString(), setData: ROLE_SET_DATA.toString() },
    records: {
      workspace: "symmetry.workspace",
      territory: "symmetry.territory",
      evidence: "symmetry.evidence",
      digest: "symmetry.digest",
    },
  };
}

export function buildEnsResolverCalls(plan, values) {
  if (!plan?.node || !plan?.dnsName) throw new Error("An ENS namespace plan is required");
  return [
    {
      functionName: "authorizeTextRoles",
      args: [plan.dnsName, plan.records.digest, plan.operator, true],
      purpose: "delegate digest updates to the evidence writer",
    },
    ...Object.entries({ ...values, workspace: plan.workspaceId }).map(([key, value]) => ({
      functionName: "setText",
      args: [plan.node, key, String(value)],
      purpose: `publish ${key} on the territory namespace`,
    })),
  ];
}
