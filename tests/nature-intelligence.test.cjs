const assert = require("node:assert/strict");
const test = require("node:test");

const {
  NatureService,
} = require("../backend/api-gateway/dist/services/nature.service.js");

const rootAddress = "0x1111111111111111111111111111111111111111";
const polygon = {
  type: "Polygon",
  coordinates: [[
    [-76.7, 1.1],
    [-76.6, 1.1],
    [-76.6, 1.2],
    [-76.7, 1.1],
  ]],
};

test("Nature Intelligence turns territorial observations into alerts and evidence passports", () => {
  const service = new NatureService();
  const workspace = service.createWorkspace({
    enterpriseId: 1,
    rootAddress,
    name: "Alto Putumayo conservation corridor",
  });
  const territory = service.registerTerritory(workspace.workspaceId, {
    territoryRef: "CO-PUTUMAYO-001",
    name: "Pilot territory",
    geometry: polygon,
    geometryDigest: `0x${"11".repeat(32)}`,
    areaHectares: 1280,
  });

  service.recordObservation(workspace.workspaceId, {
    territoryId: territory.id,
    source: "copernicus-sentinel-2",
    capturedAt: "2026-06-01T00:00:00.000Z",
    metrics: {
      treeCoverPercentage: 91.4,
      ndviMean: 0.78,
      cloudCoverPercentage: 8,
    },
    evidenceUri: "s3://symmetry-nature/pilot/baseline.json",
    evidenceDigest: `0x${"22".repeat(32)}`,
  });
  const current = service.recordObservation(workspace.workspaceId, {
    territoryId: territory.id,
    source: "copernicus-sentinel-2",
    capturedAt: "2026-07-18T00:00:00.000Z",
    metrics: {
      treeCoverPercentage: 89.1,
      ndviMean: 0.54,
      cloudCoverPercentage: 5,
    },
    evidenceUri: "s3://symmetry-nature/pilot/current.json",
    evidenceDigest: `0x${"33".repeat(32)}`,
  });

  assert.equal(current.comparison.treeCoverChangePercentagePoints, -2.3);
  assert.equal(current.comparison.ndviChange, -0.24);
  assert.equal(workspace.alerts.length, 1);
  assert.equal(workspace.alerts[0].severity, "high");

  const passport = service.prepareEvidencePassport(workspace.workspaceId, {
    observationId: current.id,
    alertId: workspace.alerts[0].id,
    manifestUri: "ipfs://nature-evidence-passport",
    manifestDigest: `0x${"44".repeat(32)}`,
  });

  assert.equal(passport.territoryId, territory.id);
  assert.equal(passport.status, "prepared");
});

test("Nature Intelligence rejects invalid unclosed GeoJSON polygons", () => {
  const service = new NatureService();
  const workspace = service.createWorkspace({
    enterpriseId: 1,
    rootAddress,
    name: "Validation workspace",
  });

  assert.throws(
    () => service.registerTerritory(workspace.workspaceId, {
      territoryRef: "INVALID",
      name: "Invalid territory",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-76.7, 1.1],
          [-76.6, 1.1],
          [-76.6, 1.2],
          [-76.7, 1.2],
        ]],
      },
      geometryDigest: `0x${"55".repeat(32)}`,
    }),
    /polygon ring must be closed/i,
  );
});
