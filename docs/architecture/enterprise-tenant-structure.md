# Enterprise Tenant Structure

> Superseded architecture. The canonical model is now `1 company = 1 root diamond`; see `root-per-company-architecture.md`. References to tenant folders and shared on-chain tenancy below are retained only as historical design context.

## Purpose

This document explains how a client company is represented inside Symmetry Enterprises across:

- off-chain infrastructure
- on-chain protocol state
- service activation
- evidence and audit domains

The goal is that one enterprise can consume:

- `VotoID`
- `Smart Process Automation`
- `EUDR`

with one shared identity and one shared governance boundary.

## 1. Enterprise as a Tenant

Each client company exists in two synchronized forms:

### Off-chain tenant

This is the physical workspace inside the infrastructure.

Example:

- historical `tenant.json` workspace manifest

That tenant folder is where Symmetry keeps:

- enterprise metadata
- service-specific configs
- evidence bundles
- audit exports
- integration files
- future generated artifacts

### On-chain tenant

This is the protocol representation inside the Diamond.

Core modules:

- [EnterpriseRegistryFacet.sol](../../contracts/facets/EnterpriseRegistryFacet.sol)
- [AccessControlFacet.sol](../../contracts/facets/AccessControlFacet.sol)
- [CorporateIdentityFacet.sol](../../contracts/facets/CorporateIdentityFacet.sol)
- [ServiceEntitlementFacet.sol](../../contracts/facets/ServiceEntitlementFacet.sol)
- [EvidenceFacet.sol](../../contracts/facets/EvidenceFacet.sol)
- [AuditFacet.sol](../../contracts/facets/AuditFacet.sol)

This is where Symmetry keeps:

- `enterpriseId`
- legal identity
- admin wallet
- multisig wallet
- enabled service map
- authorized wallets
- authorized signers
- audit records
- evidence anchors

## 2. Tenant Folder Layout

Example tenant root:

- `storage/object-store/tenants/enterprise-0001-symmetry-test-exporters-sas`

### `tenant.json`

Purpose:

- top-level tenant manifest
- legal name
- jurisdiction
- selected services
- provisioning status

This is the off-chain summary pointer for orchestration.

### `identity/`

Purpose:

- corporate identity documents
- KYB package references
- signer policy snapshots
- future DID or credential exports

This folder mirrors the on-chain identity plane managed by `CorporateIdentityFacet`.

### `evidence/`

Purpose:

- raw documentary bundles
- evidence manifests
- hash inputs before anchoring
- linked support files

This folder feeds `EvidenceFacet`.

### `audit/`

Purpose:

- exported audit packs
- internal audit notes
- historical operational traces
- regulator-ready bundles

This folder complements `AuditFacet`.

### `integrations/`

Purpose:

- ERP connector configs
- webhook configs
- export adapter mappings
- service account metadata

This becomes more important when `Automation` and `EUDR` mature.

### `exports/`

Purpose:

- PDFs
- dashboards
- signed reports
- customer deliverables

This is not canonical protocol state. It is the delivery/output layer.

### `compliance/`

Purpose:

- due diligence working files
- policy outputs
- verifier notes
- pre-certification dossiers

This will be heavily used by `EUDR`.

### `services/`

Purpose:

- per-service operational separation

Inside it, each active service gets its own namespace.

## 3. Service Folders

### `services/votoid/`

Subfolders:

- `boards/`
- `config/`
- `evidence/`

Use:

- board definitions
- resolution templates
- quorum configs
- vote document bundles

This maps later to `VotoIDFacet`.

### `services/automation/`

Subfolders:

- `config/`
- `workflows/`
- `checkpoints/`

Use:

- workflow templates
- instantiated process metadata
- external trigger mappings

This maps later to `AutomationFacet`.

### `services/eudr/`

Subfolders:

- `config/`
- `batches/`
- `certificates/`
- `geodata/`

Use:

- exporter dossier config
- batch working files
- certificate payload preparation
- parcel and geospatial references

This maps later to `Traceability`, `Compliance`, and `Certification`.

## 4. On-Chain Module Responsibilities

### `EnterpriseRegistryFacet`

Represents the legal tenant shell:

- legal name
- jurisdiction
- admin
- multisig
- active flag
- service bitmask summary

### `AccessControlFacet`

Represents who can act:

- protocol admins
- enterprise admins
- enterprise operators
- identity admins
- auditors
- delegates with expiry

### `CorporateIdentityFacet`

Represents enterprise identity and signer binding:

- display identity
- DID reference
- credentials URI
- bound wallets
- signer authorizations

### `ServiceEntitlementFacet`

Represents which business services are active and their config URI.

Important note:

- `EnterpriseRegistryFacet` stores the compact service bitmask summary.
- `ServiceEntitlementFacet` stores the per-service operational config.

This is intentional, but the bitmask should be treated as summary state and the facet config as the detailed operational state.

### `EvidenceFacet`

Represents immutable proof anchors:

- digest
- evidence type
- URI
- submitting actor

### `AuditFacet`

Represents enterprise history:

- action category
- subject type
- subject id
- evidence digest
- note URI
- actor

## 5. How the Company Actually Operates

When a client signs with Symmetry:

1. Symmetry provisions the tenant folder off-chain.
2. Symmetry onboards the company in the Diamond.
3. Symmetry assigns admin and multisig.
4. Symmetry creates the corporate identity.
5. Symmetry enables one or more services.
6. Service-specific configs and artifacts live under that tenant folder.
7. High-integrity state transitions live on-chain.
8. Evidence and audit connect both worlds.

## 6. What I Corrected

Two admin-rotation issues were adjusted in [EnterpriseRegistryFacet.sol](../../contracts/facets/EnterpriseRegistryFacet.sol):

- rotating the enterprise admin could accidentally strip `ENTERPRISE_ADMIN_ROLE` from an address that was also the current multisig
- rotating the multisig could accidentally strip `ENTERPRISE_ADMIN_ROLE` from an address that was also the current admin

That is now guarded so the dual-role case does not break governance accidentally.

## 7. What Is Still Intentionally Simple

These parts are scaffold-level and will mature later:

- backend onboarding persistence is still in-memory
- no database wiring yet
- tenant provisioning is filesystem-based and local
- no live chain deployment wiring from backend yet
- no event indexer consuming protocol events yet

That is acceptable at this phase because the infrastructure objective was:

- define the tenant model
- define the Diamond core
- define identity/access/evidence/audit
- leave the system ready for the first full service implementation
