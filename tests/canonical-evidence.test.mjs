import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalEvidenceJson,
  evidenceAnchorDigest,
} from "../services/evidence-normalizer/canonical-evidence.mjs";

function manifest() {
  return {
    manifestVersion: "1.0.0",
    manifestId: "manifest-test",
    enterpriseRoot: "0x1111111111111111111111111111111111111111",
    localEnterpriseId: 1,
    service: "shared",
    subjectType: "enterprise",
    subjectId: "onboarding",
    evidenceType: "kyb-package",
    contentDigestKeccak256: `0x${"22".repeat(32)}`,
    payload: {
      canonicalFilename: "kyb.zip",
      mimeType: "application/zip",
      sizeBytes: 1024,
    },
    locations: {
      operationalStorageUri: "s3://enterprise/evidence/kyb.zip",
      ipfsCid: "bafy-test",
      filecoinPayloadCid: "bafy-payload-test",
      filecoinDealIds: [101, 202],
      arweaveTxId: "arweave-test",
    },
    createdBy: "symmetry-ops",
    createdAt: "2026-07-14T00:00:00.000Z",
    supersedesManifestId: null,
    status: "replicating",
    replication: {},
  };
}

test("canonical digest is independent from object key insertion order", () => {
  const first = manifest();
  const second = {
    ...first,
    payload: {
      sizeBytes: first.payload.sizeBytes,
      canonicalFilename: first.payload.canonicalFilename,
      mimeType: first.payload.mimeType,
    },
  };

  assert.equal(canonicalEvidenceJson(first), canonicalEvidenceJson(second));
  assert.equal(evidenceAnchorDigest(first), evidenceAnchorDigest(second));
});

test("immutable evidence changes invalidate the prepared digest", () => {
  const original = manifest();
  const preparedDigest = evidenceAnchorDigest(original);
  const altered = structuredClone(original);
  altered.payload.sizeBytes += 1;

  assert.notEqual(evidenceAnchorDigest(altered), preparedDigest);
});

test("mutable health and on-chain receipt fields do not change the anchor", () => {
  const original = manifest();
  const finalManifest = structuredClone(original);
  finalManifest.status = "anchored";
  finalManifest.replication = {
    onChainAnchor: {
      present: true,
      evidenceId: 7,
      txHash: `0x${"33".repeat(32)}`,
    },
  };

  assert.equal(evidenceAnchorDigest(finalManifest), evidenceAnchorDigest(original));
});
