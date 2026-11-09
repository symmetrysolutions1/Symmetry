/**
 * CRE workflow shape for the ETHOnline Continuity slice.
 *
 * This file intentionally keeps the vendor SDK import out of the root build: the
 * official `cre` CLI generates the SDK project during hackathon implementation.
 * `decision.mjs` is the deterministic, unit-tested core used by the workflow.
 *
 * Runtime sequence:
 * 1. A cron or HTTP trigger invokes the workflow.
 * 2. `handlerInTee` reads Copernicus credentials and calls the existing Nature API.
 * 3. `evaluateCopernicusObservation` runs inside the enclave.
 * 4. Only the verdict, digest and `anchorPassport` call leave the enclave.
 * 5. The DON reports the call to NatureEvidenceRegistry, creating an on-chain state change.
 */
export const CRE_WORKFLOW_CONTRACT = "NatureEvidenceRegistry.anchorPassport";
export const CRE_SECRET_IDS = ["COPERNICUS_CLIENT_ID", "COPERNICUS_CLIENT_SECRET"];
export const CRE_ENCLAVE_BOUNDARY = {
  private: ["Copernicus OAuth credentials", "raw imagery/statistical response", "alert thresholds"],
  public: ["decision", "canonical digest", "registry calldata"],
};
