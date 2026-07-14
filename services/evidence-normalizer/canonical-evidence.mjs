import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let sha3;
try {
  sha3 = require("js-sha3");
} catch {
  const solcRequire = createRequire(require.resolve("solc"));
  sha3 = solcRequire("js-sha3");
}
const { keccak256 } = sha3;

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, sortValue(value[key])]),
    );
  }
  return value;
}

export function evidenceAnchorScope(manifest) {
  return {
    manifestVersion: manifest.manifestVersion,
    manifestId: manifest.manifestId,
    enterpriseRoot: manifest.enterpriseRoot,
    localEnterpriseId: manifest.localEnterpriseId,
    service: manifest.service,
    subjectType: manifest.subjectType,
    subjectId: manifest.subjectId,
    evidenceType: manifest.evidenceType,
    contentDigestKeccak256: manifest.contentDigestKeccak256,
    payload: manifest.payload,
    locations: {
      operationalStorageUri: manifest.locations?.operationalStorageUri,
      ipfsCid: manifest.locations?.ipfsCid,
      filecoinPayloadCid: manifest.locations?.filecoinPayloadCid,
      filecoinDealIds: manifest.locations?.filecoinDealIds,
      arweaveTxId: manifest.locations?.arweaveTxId,
    },
    createdBy: manifest.createdBy,
    createdAt: manifest.createdAt,
    supersedesManifestId: manifest.supersedesManifestId ?? null,
  };
}

export function canonicalEvidenceJson(manifest) {
  return JSON.stringify(sortValue(evidenceAnchorScope(manifest)));
}

export function evidenceAnchorDigest(manifest) {
  return `0x${keccak256(canonicalEvidenceJson(manifest))}`;
}
