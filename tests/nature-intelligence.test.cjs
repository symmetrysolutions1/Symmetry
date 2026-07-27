const assert = require("node:assert/strict");
const test = require("node:test");

const {
  NatureService,
} = require("../backend/api-gateway/dist/services/nature.service.js");
const {
  CopernicusStacService,
} = require("../backend/api-gateway/dist/services/copernicus-stac.service.js");
const {
  CopernicusStatisticsService,
} = require("../backend/api-gateway/dist/services/copernicus-statistics.service.js");

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

test("Copernicus STAC integration discovers Sentinel-2 scenes for a registered territory", async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    assert.equal(url, "https://stac.dataspace.copernicus.eu/v1/search");
    const request = JSON.parse(options.body);
    assert.deepEqual(request.collections, ["sentinel-2-l2a"]);
    assert.deepEqual(request.intersects, polygon);
    assert.equal(request.query["eo:cloud_cover"].lte, 20);

    return new Response(JSON.stringify({
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        id: "S2B_TEST_SCENE",
        collection: "sentinel-2-l2a",
        bbox: [-76.7, 1.1, -76.6, 1.2],
        geometry: polygon,
        properties: {
          datetime: "2026-07-18T15:30:00.000Z",
          "eo:cloud_cover": 4.2,
        },
        assets: {
          visual: {
            href: "https://example.invalid/visual.tif",
            type: "image/tiff",
            roles: ["visual"],
          },
        },
        links: [{
          rel: "self",
          href: "https://stac.dataspace.copernicus.eu/v1/collections/sentinel-2-l2a/items/S2B_TEST_SCENE",
        }],
      }],
    }), {
      status: 200,
      headers: {
        "content-type": "application/geo+json",
      },
    });
  };

  try {
    const service = new NatureService(new CopernicusStacService());
    const workspace = service.createWorkspace({
      enterpriseId: 1,
      rootAddress,
      name: "Copernicus workspace",
    });
    const territory = service.registerTerritory(workspace.workspaceId, {
      territoryRef: "CO-COPERNICUS-1",
      name: "Copernicus pilot",
      geometry: polygon,
      geometryDigest: `0x${"77".repeat(32)}`,
    });

    const result = await service.searchCopernicusScenes(
      workspace.workspaceId,
      territory.id,
      {
        from: "2026-07-01T00:00:00.000Z",
        to: "2026-07-26T23:59:59.000Z",
        maxCloudCover: 20,
        limit: 5,
      },
    );

    assert.equal(result.provider, "copernicus-data-space-ecosystem");
    assert.equal(result.scenes.length, 1);
    assert.equal(result.scenes[0].id, "S2B_TEST_SCENE");
    assert.equal(result.scenes[0].cloudCoverPercentage, 4.2);
  } finally {
    global.fetch = originalFetch;
  }
});

test("Copernicus Statistical API integration returns a cloud-masked NDVI series", async () => {
  const originalFetch = global.fetch;
  const originalClientId = process.env.COPERNICUS_CLIENT_ID;
  const originalClientSecret = process.env.COPERNICUS_CLIENT_SECRET;
  process.env.COPERNICUS_CLIENT_ID = "test-client";
  process.env.COPERNICUS_CLIENT_SECRET = "test-secret";
  const requests = [];

  global.fetch = async (url, options) => {
    requests.push({ url, options });
    if (url.includes("/token")) {
      assert.match(options.body, /client_id=test-client/);
      return new Response(JSON.stringify({
        access_token: "test-access-token",
        expires_in: 600,
      }), { status: 200 });
    }

    assert.equal(url, "https://sh.dataspace.copernicus.eu/statistics/v1");
    assert.equal(options.headers.authorization, "Bearer test-access-token");
    const request = JSON.parse(options.body);
    assert.equal(request.input.data[0].type, "sentinel-2-l2a");
    assert.match(request.aggregation.evalscript, /B08/);
    assert.match(request.aggregation.evalscript, /SCL/);

    return new Response(JSON.stringify({
      status: "OK",
      data: [{
        interval: {
          from: "2026-06-01T00:00:00Z",
          to: "2026-06-06T00:00:00Z",
        },
        outputs: {
          ndvi: {
            bands: {
              B0: {
                stats: {
                  min: 0.12,
                  max: 0.91,
                  mean: 0.67,
                  stDev: 0.08,
                  sampleCount: 900,
                  noDataCount: 100,
                },
              },
            },
          },
        },
      }],
    }), { status: 200 });
  };

  try {
    const statistics = new CopernicusStatisticsService();
    const service = new NatureService(new CopernicusStacService(), statistics);
    const workspace = service.createWorkspace({
      enterpriseId: 1,
      rootAddress,
      name: "NDVI workspace",
    });
    const territory = service.registerTerritory(workspace.workspaceId, {
      territoryRef: "CO-NDVI-1",
      name: "NDVI pilot",
      geometry: polygon,
      geometryDigest: `0x${"88".repeat(32)}`,
    });

    const result = await service.calculateCopernicusNdvi(
      workspace.workspaceId,
      territory.id,
      {
        from: "2026-06-01T00:00:00.000Z",
        to: "2026-06-11T00:00:00.000Z",
        aggregationIntervalDays: 5,
      },
    );

    assert.equal(requests.length, 2);
    assert.equal(result.territoryId, territory.id);
    assert.equal(result.intervals[0].mean, 0.67);
    assert.deepEqual(result.methodology.excludedSceneClasses, [3, 8, 9, 10, 11]);
  } finally {
    global.fetch = originalFetch;
    if (originalClientId === undefined) delete process.env.COPERNICUS_CLIENT_ID;
    else process.env.COPERNICUS_CLIENT_ID = originalClientId;
    if (originalClientSecret === undefined) delete process.env.COPERNICUS_CLIENT_SECRET;
    else process.env.COPERNICUS_CLIENT_SECRET = originalClientSecret;
  }
});
