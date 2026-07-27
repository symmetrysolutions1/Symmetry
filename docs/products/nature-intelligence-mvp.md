# Symmetry Nature Intelligence

## Product position

Symmetry Nature Intelligence turns geospatial observations and territorial validation into
traceable evidence for conservation, deforestation-risk management, and environmental
compliance.

The product is not presented as a blockchain application because customers buy monitoring,
risk visibility, traceability, and proof. Blockchain is nevertheless a core infrastructure
layer: it anchors enterprise identity, permissions, evidence manifests, material state changes,
and audit events after operational data has been collected and validated.

Large satellite images and geospatial datasets remain off-chain. Their canonical digests,
provenance references, validation state, and audit linkage can be anchored through the
enterprise root and `EvidenceFacet`. This gives the offer technical solidity without claiming
that putting raw imagery on-chain improves the underlying analysis.

## MVP flow

1. Register a territory as a GeoJSON polygon.
2. Record observations from a declared source such as Copernicus Sentinel-2.
3. Compare tree-cover and NDVI metrics with the previous observation.
4. Open an alert when configured change thresholds are exceeded.
5. Prepare an evidence passport that links the territory, observation, alert, and canonical
   evidence manifest.

## API

The API gateway exposes:

- `POST /nature/workspaces`
- `GET /nature/workspaces/:workspaceId`
- `POST /nature/workspaces/:workspaceId/territories`
- `POST /nature/workspaces/:workspaceId/territories/:territoryId/copernicus/scenes/search`
- `POST /nature/workspaces/:workspaceId/territories/:territoryId/copernicus/ndvi`
- `POST /nature/workspaces/:workspaceId/observations`
- `POST /nature/workspaces/:workspaceId/evidence-passports`

See [`pilot-workspace.example.json`](../../services/nature-intelligence/pilot-workspace.example.json)
for a demonstration payload.

## What is implemented

- GeoJSON polygon validation
- territory registry
- source-attributed environmental observations
- live, unauthenticated Sentinel-2 L2A scene discovery through the official Copernicus Data
  Space Ecosystem STAC API
- deterministic comparison of tree-cover and NDVI metrics
- configurable alert thresholds and severity
- evidence-passport preparation
- automated tests for the primary flow and invalid geometry

## What is not implemented yet

- live authenticated NDVI processing until an OAuth client is configured
- raster processing, cloud masking, or independently validated land-cover classification
- an interactive map and dashboard
- durable database storage and background jobs
- cryptographic anchoring of the generated passport through `EvidenceFacet`
- field-verification workflows

These boundaries are deliberate. The MVP demonstrates the product contract and traceability
flow without representing example data as a live environmental result.

## Copernicus integration

Scene discovery uses the current CDSE STAC endpoint:

`https://stac.dataspace.copernicus.eu/v1`

The API searches the `sentinel-2-l2a` collection with the registered territory polygon, an ISO
date range, a maximum cloud-cover threshold, and a bounded result limit. This step is live and
does not require credentials.

Run the connectivity smoke test with:

```powershell
node scripts/nature/search-copernicus-scenes.mjs
```

NDVI is never inferred from catalogue metadata. The NDVI endpoint uses the authenticated
Sentinel Hub Statistical API, bands B08 and B04, and excludes SCL classes 3, 8, 9, 10, and 11
to mask cloud shadow, clouds, cirrus, and snow/ice. Configure:

- `COPERNICUS_CLIENT_ID`
- `COPERNICUS_CLIENT_SECRET`

The client secret belongs in a secret manager or local untracked environment, never in source
control. Tree-cover classification still requires a separate declared and independently
validated methodology; NDVI alone is not proof of deforestation.

## Market narrative

**Category:** verifiable operational infrastructure for organizations that need to observe,
manage, and prove what happens in a territory.

**Initial wedge:** organizations and supply chains that must demonstrate deforestation-free
origin or monitor conservation projects.

**Expansion:** restoration, biodiversity, nature finance, environmental reporting, and
territorial risk management.

**Product promise:** from Earth observation to evidence that can be acted on, audited, and
financed.

**Trust promise:** a report is not only visible; its source, history, validation, and integrity
can be independently checked.
