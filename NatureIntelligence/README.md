# Nature Intelligence — Tayrona Sentinel

Nature Intelligence is the geospatial monitoring layer of Symmetry. This
focused pilot treats Parque Nacional Natural Tayrona as a verifiable
territorial asset and connects Copernicus observations to typed environmental
alerts and Áureo evidence anchoring.

## Pilot flow

```text
Official Tayrona GeoJSON
        ↓
Registered territory asset
        ↓
Copernicus Sentinel-2 observation
        ↓
Change comparison and typed alert
        ↓
Evidence manifest and digest
        ↓
Áureo environmental alert
        ↓
EVM transaction and explorer receipt
```

## Alert types

- `vegetation_loss`: tree-cover decrease
- `ndvi_drop`: vegetation-health signal decrease
- `water_change`: NDWI decrease
- `fire_signal`: burned-area signal increase
- `human_activity`: built-up signal increase

These are observation signals, not automatic findings of illegal activity or
confirmed deforestation. Field validation remains necessary for operational
decisions.

## What is implemented

- GeoJSON territory registration as an asset.
- Copernicus STAC scene discovery and Statistical API NDVI integration.
- Threshold-based comparison for vegetation, NDVI, water, fire and built-up
  signals.
- Evidence passport preparation with manifest URI and digest.
- Payload builder and bridge route from Symmetry to Áureo.
- Áureo contract event `EnvironmentalAlertStarted` for the typed alert anchor.

## Relevant implementation

- Nature service: [`backend/api-gateway/src/services/nature.service.ts`](../backend/api-gateway/src/services/nature.service.ts)
- Copernicus STAC: [`backend/api-gateway/src/services/copernicus-stac.service.ts`](../backend/api-gateway/src/services/copernicus-stac.service.ts)
- Copernicus statistics: [`backend/api-gateway/src/services/copernicus-statistics.service.ts`](../backend/api-gateway/src/services/copernicus-statistics.service.ts)
- Áureo bridge: [`backend/api-gateway/src/services/aureo-nature-bridge.service.ts`](../backend/api-gateway/src/services/aureo-nature-bridge.service.ts)
- API routes: [`backend/api-gateway/src/routes/nature.controller.ts`](../backend/api-gateway/src/routes/nature.controller.ts)
- Integration documentation: [`docs/integrations/aureo-nature-alerts.md`](../docs/integrations/aureo-nature-alerts.md)

## Tayrona asset source

The pilot uses the official Parques Nacionales polygon for the `Tayrona`
feature, in WGS84. The exact GeoJSON geometry is kept off-chain and identified
by a digest in the territory record.

## Current status

The Nature Intelligence and Áureo integration is a verified local MVP. The
remaining demo step is a public HSK testnet deployment and a real
observation-to-alert transaction with a Blockscout receipt.

## Ready before wallet funding

The repository-side work that does not require a wallet is complete:

- Typed environmental alert categories and threshold comparison.
- Tayrona asset boundary and evidence-manifest references kept off-chain.
- Copernicus STAC scene discovery and NDVI statistics integration.
- Symmetry-to-Áureo bridge payload and local prepared-mode verification.
- Áureo contract event and deployment configuration for HSK Testnet.

The remaining network gate is deliberately small: deploy `AureoCore`, point
the backend at its address, submit one real Tayrona alert, and record the
transaction URL from the HSK explorer. The alert is an observation signal,
not an automatic legal or field finding.

## Verification

From the repository root:

```bash
pnpm --filter @symmetry/api-gateway build
node tests/nature-intelligence.test.cjs
```

## Local configuration

Copy `.env.example` to `.env` and set the Copernicus OAuth client values
locally. The client secret must remain untracked. The API gateway loads this
file when started with Node 22 or later:

```bash
cp .env.example .env
pnpm --filter @symmetry/api-gateway build
pnpm --filter @symmetry/api-gateway start
```

Set `AUREO_BRIDGE_URL` to the Áureo backend endpoint before running the
anchoring request. Without a funded HSK deployment, the bridge can still be
reviewed in prepared mode; a `202` response means the alert was normalized and
stored locally, not written on-chain.
