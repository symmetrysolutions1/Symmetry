const test = require("node:test");
const assert = require("node:assert/strict");

test("ENSv2 plan creates a territory namespace and delegated record roles", async () => {
  const { buildEnsNamespacePlan, buildEnsResolverCalls } = await import("../integrations/ethonline2026/ensv2.mjs");
  const plan = buildEnsNamespacePlan({
    rootName: "nature.eth",
    territoryRef: "Amazonas 01",
    workspaceId: `0x${"11".repeat(32)}`,
    operator: `0x${"22".repeat(20)}`,
  });
  assert.equal(plan.chainId, 11155111);
  assert.equal(plan.fullName, "amazonas-01.nature.eth");
  assert.match(plan.node, /^0x[0-9a-f]{64}$/);
  assert.equal(plan.roles.setText, "16");
  assert.equal(buildEnsResolverCalls(plan, { evidence: "ipfs://passport" }).length, 3);
});

test("CRE decision produces an alert and an anchor call without raw imagery", async () => {
  const { buildCreAnchorPayload } = await import("../integrations/ethonline2026/chainlink-cre/decision.mjs");
  const payload = buildCreAnchorPayload({
    workspaceId: `0x${"11".repeat(32)}`,
    passportId: `0x${"22".repeat(32)}`,
    territoryId: `0x${"33".repeat(32)}`,
    observationId: `0x${"44".repeat(32)}`,
    manifestDigest: `0x${"55".repeat(32)}`,
    ensNode: `0x${"66".repeat(32)}`,
    observation: { ndviMean: 0.2, previousNdviMean: 0.5, treeCoverPercentage: 40, previousTreeCoverPercentage: 43 },
  });
  assert.equal(payload.decision.verdict, "ALERT");
  assert.equal(payload.decision.severity, "high");
  assert.equal(payload.onchainCall.functionName, "anchorPassport");
  assert.ok(!JSON.stringify(payload).includes("raw satellite response"));
});
