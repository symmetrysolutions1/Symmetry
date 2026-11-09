import sha3 from "js-sha3";

const { keccak256 } = sha3;

const round = (value, decimals = 4) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

function requireFinite(value, label) {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

export function evaluateCopernicusObservation(input, thresholds = {}) {
  const ndviMean = requireFinite(Number(input.ndviMean), "ndviMean");
  const treeCoverPercentage = requireFinite(Number(input.treeCoverPercentage), "treeCoverPercentage");
  const previousNdviMean = input.previousNdviMean === undefined
    ? undefined
    : requireFinite(Number(input.previousNdviMean), "previousNdviMean");
  const previousTreeCoverPercentage = input.previousTreeCoverPercentage === undefined
    ? undefined
    : requireFinite(Number(input.previousTreeCoverPercentage), "previousTreeCoverPercentage");

  if (ndviMean < -1 || ndviMean > 1) throw new Error("ndviMean must be between -1 and 1");
  if (treeCoverPercentage < 0 || treeCoverPercentage > 100) throw new Error("treeCoverPercentage must be between 0 and 100");

  const ndviDropThreshold = Number(thresholds.ndviDrop ?? 0.1);
  const treeCoverLossThreshold = Number(thresholds.treeCoverLossPercentagePoints ?? 1);
  const ndviChange = previousNdviMean === undefined ? undefined : round(ndviMean - previousNdviMean);
  const treeCoverChange = previousTreeCoverPercentage === undefined
    ? undefined
    : round(treeCoverPercentage - previousTreeCoverPercentage);
  const ndviDrop = ndviChange === undefined ? 0 : Math.max(0, -ndviChange);
  const treeCoverLoss = treeCoverChange === undefined ? 0 : Math.max(0, -treeCoverChange);
  const reasons = [];
  if (treeCoverLoss >= treeCoverLossThreshold) reasons.push(`TREE_COVER_LOSS:${treeCoverLoss}`);
  if (ndviDrop >= ndviDropThreshold) reasons.push(`NDVI_DROP:${ndviDrop}`);

  const severity = treeCoverLoss >= treeCoverLossThreshold * 2 || ndviDrop >= ndviDropThreshold * 2
    ? "high"
    : reasons.length > 0 ? "medium" : "none";

  return {
    verdict: reasons.length > 0 ? "ALERT" : "PASS",
    severity,
    reasons,
    ndviChange,
    treeCoverChange,
    methodology: { source: "copernicus-data-space-ecosystem", collection: "sentinel-2-l2a", bands: ["B08", "B04"] },
  };
}

export function buildCreAnchorPayload({ workspaceId, passportId, territoryId, observationId, manifestDigest, ensNode, observation, thresholds }) {
  const decision = evaluateCopernicusObservation(observation, thresholds);
  const canonical = JSON.stringify({ workspaceId, passportId, territoryId, observationId, manifestDigest, ensNode, decision });
  return {
    decision,
    canonicalDigest: `0x${keccak256(canonical)}`,
    onchainCall: {
      functionName: "anchorPassport",
      args: [workspaceId, passportId, territoryId, observationId, manifestDigest, ensNode],
    },
    privacyBoundary: {
      enclaveInputs: ["COPERNICUS_CLIENT_SECRET", "raw satellite response", "threshold policy"],
      consensusOutputs: ["verdict", "severity", "reasons", "canonicalDigest", "onchainCall"],
    },
  };
}
