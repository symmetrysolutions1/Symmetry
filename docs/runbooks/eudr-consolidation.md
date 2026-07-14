# EUDR Consolidation Runbook

This runbook defines what "consolidated" means for `EUDR` inside Symmetry.

## Goal

Move `EUDR` from:

- architecture and operations documented
- no base service implementation

to:

- actor, parcel, batch, custody and certificate primitives implemented
- root-level service profile defined
- event projections specified
- backend operational adapter available
- enterprise test root prepared for integrated certification testing

## Consolidation Layers

### 1. Contract Layer

Covered by:

- `contracts/facets/EUDRFacet.sol`
- `contracts/interfaces/IEUDRFacet.sol`
- `contracts/libraries/LibEUDR.sol`
- `tests/foundry/EUDRFlow.t.sol`

### 2. Root Service Layer

The root enterprise must carry:

- `ServiceEntitlementFacet` enabled for service id `2`
- a dedicated EUDR config URI
- role model for exporters, producers and verifiers

Reference file:

- `services/eudr/symmetry-root.eudr-service-config.example.json`

### 3. Projection Layer

The indexer must recognize and route:

- supply actor events
- traceability and custody events
- certification lifecycle events

Reference files:

- `indexers/projections/projection-catalog.json`
- `indexers/projections/eudr-projection-model.md`

### 4. Backend Operations Layer

The API gateway now carries a minimal EUDR workspace adapter so Symmetry can model actors, parcels, batches and certificates around a root deployment before live chain adapters are wired.

Reference files:

- `backend/api-gateway/src/services/eudr.service.ts`
- `backend/api-gateway/src/routes/eudr.controller.ts`

## What Still Comes After Consolidation

Consolidation does not yet mean production-ready.

The next gates are:

- live deploy to Polygon Amoy
- real event ingestion
- real GIS and satellite validation integrations
- manifest publication to IPFS/Filecoin/Arweave
- QR and digital passport delivery
