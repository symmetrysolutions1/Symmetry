const assert = require("node:assert/strict");
const test = require("node:test");

const {
  AutomationService,
} = require("../backend/api-gateway/dist/services/automation.service.js");
const { EudrService } = require("../backend/api-gateway/dist/services/eudr.service.js");
const {
  OnboardingService,
} = require("../backend/api-gateway/dist/services/onboarding.service.js");
const { VotoIDService } = require("../backend/api-gateway/dist/services/votoid.service.js");

const rootAddress = "0x1111111111111111111111111111111111111111";

test("enterprise onboarding draft can be created and retrieved", () => {
  const service = new OnboardingService();
  const draft = service.createDraftEnterprise({
    legalName: "Symmetry Test Enterprise",
    jurisdictionCode: "CO",
    adminWallet: rootAddress,
    multisigWallet: rootAddress,
    enabledServices: ["votoid", "automation", "eudr"],
  });

  assert.equal(draft.status, "drafted");
  assert.equal(service.getDraftEnterprise(draft.id), draft);
});

test("VotoID backend draft covers board, session, and proposal", () => {
  const service = new VotoIDService();
  const workspace = service.createWorkspace({
    enterpriseId: 1,
    rootAddress,
    chairperson: "0x2222222222222222222222222222222222222222",
    secretary: "0x3333333333333333333333333333333333333333",
    quorumPercentage: 60,
  });
  service.addBoardMember(workspace.workspaceId, "0x4444444444444444444444444444444444444444");
  const session = service.createSession(workspace.workspaceId, {
    name: "Board Session",
    deliberationDurationSeconds: 3600,
    votingDurationSeconds: 3600,
  });
  const proposal = service.createProposal(workspace.workspaceId, session.id, {
    title: "Approve policy",
    description: "Approve the enterprise policy.",
    evidenceManifestUri: "ipfs://manifest",
    evidenceManifestDigest: `0x${"22".repeat(32)}`,
  });

  assert.equal(workspace.board.members.length, 3);
  assert.equal(session.proposals[0], proposal);
  assert.equal(proposal.status, "created");
});

test("automation backend draft covers template and instance", () => {
  const service = new AutomationService();
  const workspace = service.createWorkspace({ enterpriseId: 1, rootAddress });
  const template = service.createTemplate(workspace.workspaceId, {
    name: "Invoice approval",
    configUri: "ipfs://automation-config",
    configDigest: `0x${"33".repeat(32)}`,
    checkpoints: [{
      checkpointKey: "finance-approval",
      requiredRole: "FINANCE_MANAGER",
      evidenceRequired: true,
      oracleRequired: false,
    }],
  });
  const instance = service.createInstance(workspace.workspaceId, {
    templateId: template.id,
    externalRef: "INV-0001",
    subjectType: "invoice",
    subjectId: "INV-0001",
    configUri: "ipfs://invoice-config",
  });

  assert.equal(instance.templateId, template.id);
  assert.equal(instance.status, "active");
});

test("EUDR backend draft covers parcel, batch, and certificate", () => {
  const service = new EudrService();
  const workspace = service.createWorkspace({ enterpriseId: 1, rootAddress });
  const parcel = service.registerParcel(workspace.workspaceId, {
    parcelRef: "CO-PARCEL-1",
    geoDigest: `0x${"44".repeat(32)}`,
    metadataUri: "ipfs://parcel",
  });
  const batch = service.createBatch(workspace.workspaceId, {
    batchRef: "BATCH-1",
    parcelId: parcel.id,
    quantity: 1000,
    unit: "kg",
    dossierManifestUri: "ipfs://dossier",
    dossierManifestDigest: `0x${"55".repeat(32)}`,
    currentCustodian: rootAddress,
  });
  const certificate = service.issueCertificate(workspace.workspaceId, {
    batchId: batch.id,
    certificateUri: "ipfs://certificate",
    passportUri: "ipfs://passport",
    manifestDigest: `0x${"66".repeat(32)}`,
  });

  assert.equal(certificate.status, "issued");
  assert.equal(batch.status, "certified");
  assert.equal(batch.certificateId, certificate.id);
});
