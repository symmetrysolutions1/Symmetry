# EUDR Projection Model

`EUDR` turns enterprise supply-chain evidence into replayable actor, traceability and certification state.

## Projection Groups

### `eudr_actor_projection`

Rebuilds the registered supply actors for each enterprise root.

- source events:
  - `SupplyActorRegistered`
- key:
  - `chainKey + rootAddress + enterpriseId + actorAddress`
- state:
  - role key
  - legal name
  - metadata URI
  - registered timestamp

### `eudr_traceability_projection`

Tracks the physical origin and custody lineage of EUDR lots.

- source events:
  - `ParcelRegistered`
  - `BatchCreated`
  - `CustodyTransferred`
- key:
  - `chainKey + rootAddress + enterpriseId + batchId`
- state:
  - parcel reference
  - batch reference
  - current custodian
  - quantity and unit
  - dossier manifest linkage

### `eudr_certification_projection`

Tracks validation and certification lifecycle for each batch.

- source events:
  - `DossierValidated`
  - `CertificateIssued`
  - `CertificateRevoked`
- key:
  - `chainKey + rootAddress + enterpriseId + batchId`
- state:
  - risk score
  - approval/rejection result
  - certificate URI
  - passport URI
  - certificate status

## Audit and Evidence Binding

EUDR projections should be cross-linked with:

- `EvidenceAnchored`
- `EvidenceManifestUpdated`
- `AuditRecordCreated`

That lets the platform answer:

- which evidence package backed a parcel or batch
- where custody shifted and under what manifest
- which verifier validated or revoked a certificate
