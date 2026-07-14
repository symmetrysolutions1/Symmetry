# VotoID Consolidation Runbook

This runbook defines what "consolidated" means for `VotoID` inside Symmetry.

## Goal

Move `VotoID` from:

- contract implemented
- local E2E passing

to:

- root-level service profile defined
- event projections specified
- backend operational adapter available
- enterprise test root prepared for integrated service testing

## Consolidation Layers

### 1. Contract Layer

Already covered by:

- `contracts/facets/VotoIDFacet.sol`
- `contracts/interfaces/IVotoIDFacet.sol`
- `contracts/libraries/LibVotoID.sol`
- `tests/foundry/VotoIDFlow.t.sol`

### 2. Root Service Layer

The root enterprise must carry:

- `ServiceEntitlementFacet` enabled for service id `0`
- a dedicated VotoID config URI
- board manifests and evidence policies

Reference files:

- `services/enterprise-onboarding/symmetry-enterprise-root.example.json`
- `services/votoid/symmetry-root.votoid-service-config.example.json`

### 3. Projection Layer

The indexer must recognize and route:

- board lifecycle events
- session lifecycle events
- proposal lifecycle events
- vote tally events

Reference files:

- `indexers/projections/projection-catalog.json`
- `indexers/projections/votoid-projection-model.md`

### 4. Backend Operations Layer

The API gateway now carries a minimal VotoID workspace adapter so the product can start operating around a root deployment even before live chain adapters are wired.

Reference files:

- `backend/api-gateway/src/services/votoid.service.ts`
- `backend/api-gateway/src/routes/votoid.controller.ts`

## Symmetry Test Root

Before testnet, Symmetry can act as a reference enterprise with all services enabled:

- service `0`: `VotoID`
- service `1`: `Automation`
- service `2`: `EUDR`

This root is useful to:

- validate entitlement combinations
- validate evidence and audit routing
- validate service coexistence inside one enterprise root
- drive frontend and API integration against one canonical test subject

## What Still Comes After Consolidation

Consolidation does not yet mean production-ready.

The next gates are:

- live deploy to Polygon Amoy
- live event ingestion
- manifest publication to IPFS/Filecoin/Arweave
- frontend integration
- service-level monitoring and alerting
