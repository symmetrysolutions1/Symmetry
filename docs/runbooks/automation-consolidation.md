# Automation Consolidation Runbook

This runbook defines what "consolidated" means for `Automation` inside Symmetry.

## Goal

Move `Automation` from:

- service concept documented
- contract primitives missing

to:

- workflow state machine implemented
- root-level service profile defined
- event projections specified
- backend operational adapter available
- enterprise test root prepared for integrated workflow testing

## Consolidation Layers

### 1. Contract Layer

Covered by:

- `contracts/facets/AutomationFacet.sol`
- `contracts/interfaces/IAutomationFacet.sol`
- `contracts/libraries/LibAutomation.sol`
- `tests/foundry/AutomationFlow.t.sol`

### 2. Root Service Layer

The root enterprise must carry:

- `ServiceEntitlementFacet` enabled for service id `1`
- a dedicated automation config URI
- role model for managers, approvers and oracle actors

Reference file:

- `services/automation/symmetry-root.automation-service-config.example.json`

### 3. Projection Layer

The indexer must recognize and route:

- template lifecycle events
- instance lifecycle events
- checkpoint and oracle events

Reference files:

- `indexers/projections/projection-catalog.json`
- `indexers/projections/automation-projection-model.md`

### 4. Backend Operations Layer

The API gateway now carries a minimal automation workspace adapter so Symmetry can model process templates and instances around a root deployment before live chain adapters are wired.

Reference files:

- `backend/api-gateway/src/services/automation.service.ts`
- `backend/api-gateway/src/routes/automation.controller.ts`

## What Still Comes After Consolidation

Consolidation does not yet mean production-ready.

The next gates are:

- live deploy to Polygon Amoy
- real event ingestion
- manifest publication to IPFS/Filecoin/Arweave
- ERP and callback integration
- alerting for stuck workflows and oracle latency
