# Evidence Persistence Model

## Objective

Symmetry does not rely on a single storage network for institutional evidence.

The model is:

- one canonical evidence object
- one canonical digest
- one canonical evidence manifest
- multiple persistence backends
- on-chain anchoring of integrity and authority

This design exists so that the failure of one network does not destroy institutional truth.

## Core principle

The same evidence may exist in:

- enterprise operational storage
- IPFS
- Filecoin
- Arweave

But these are not interchangeable by default.

They only become reliable redundancy if Symmetry enforces:

- canonical hashing
- manifest versioning
- replication policy
- periodic verification
- repair and rehydration workflows

## 1. Canonical evidence object

Every evidence item starts as a canonical package.

Recommended package structure:

- raw file or bundle
- normalized metadata
- evidence type
- enterprise root reference
- service reference
- subject reference
- provenance metadata
- creation timestamp
- version

Canonical digest:

- `keccak256` for on-chain anchoring

Additional content addressing:

- CID for IPFS/Filecoin-compatible distribution
- Arweave transaction id for permanent archival retrieval

## 2. Persistence layers

### Layer A: Operational storage

Purpose:

- working copy
- enterprise operations
- fast internal access
- staging before distribution

Examples:

- encrypted object storage
- enterprise file repository
- compliance working bucket

This layer is not the trust anchor. It is the operational source.

### Layer B: IPFS

Purpose:

- content-addressed distribution
- retrieval interoperability
- gateway access
- evidence sharing across systems

Important:

- IPFS does not guarantee persistence by itself
- content must be pinned or retained by active nodes/services

### Layer C: Filecoin

Purpose:

- incentivized durable storage
- long-term storage deals
- replication and renewal strategy

Important:

- Filecoin is the storage assurance layer, not the simplest everyday retrieval layer
- retrieval may happen through storage providers, retrieval providers, or hot IPFS availability

### Layer D: Arweave

Purpose:

- permanent archival copy
- immutable long-term institutional archive
- regulator-grade historical preservation

Important:

- Arweave is best used as the long-horizon archival layer

### Layer E: On-chain anchoring

Purpose:

- integrity proof
- authority proof
- timestamped institutional state
- audit trace

The chain stores:

- `digest`
- evidence metadata
- references to off-chain copies
- actor and enterprise root context

The chain does not store the raw documents.

## 3. Do all three networks keep the same information?

Yes, they can store the same underlying evidence payload.

But the right model is:

- same evidence payload
- same canonical digest
- different retrieval handles
- different trust and availability roles

That means:

- same file
- same manifest
- same integrity root
- different access paths

Example:

- IPFS CID
- Filecoin deal or payload reference
- Arweave transaction id

## 4. If Arweave fails, do we find it in Filecoin?

Not automatically by magic.

We find it there only if Symmetry has actually replicated the same canonical evidence there and recorded that relationship in the evidence manifest.

The same is true in every direction:

- if Arweave retrieval fails, recover from Filecoin or IPFS
- if Filecoin retrieval fails, recover from Arweave or IPFS
- if IPFS availability drops, recover from operational storage, Filecoin, or Arweave and re-pin

So the resilience guarantee comes from:

- intentional multi-write
- recorded references
- periodic health checks
- automated repair

Not from assuming the networks synchronize each other on their own.

## 5. Evidence manifest

Each evidence item should have a manifest.

Suggested fields:

- `manifestVersion`
- `enterpriseRoot`
- `localEnterpriseId`
- `service`
- `subjectType`
- `subjectId`
- `evidenceType`
- `contentDigestKeccak256`
- `contentCid`
- `arweaveTxId`
- `filecoinPayloadCid`
- `filecoinDealIds`
- `operationalStorageUri`
- `createdBy`
- `createdAt`
- `supersedesManifestId`
- `status`

This manifest becomes the reconciliation layer between all storage systems.

## 6. On-chain evidence record

`EvidenceFacet` should eventually anchor:

- enterprise root or company key
- local enterprise id
- evidence id
- evidence type
- `digest`
- manifest URI
- optional IPFS CID reference
- optional Arweave tx reference
- actor

The current scaffold already anchors:

- digest
- evidence type
- URI
- submitter

Later we should evolve it toward full manifest-aware anchoring.

## 7. Recommended lifecycle

### Step 1: Create evidence package

Generate:

- canonical file or bundle
- metadata
- digest

### Step 2: Write to operational storage

Store first in operational storage for immediate workflow access.

### Step 3: Publish to IPFS

Generate CID and pin across multiple pinning targets.

### Step 4: Commit to Filecoin

Store the payload through a Filecoin storage workflow with replication and renewal policy.

### Step 5: Archive to Arweave

Write the canonical package or archival package permanently.

### Step 6: Build manifest

Record every retrieval handle and integrity value in one manifest.

### Step 7: Anchor on-chain

Anchor the digest and manifest reference through `EvidenceFacet`.

### Step 8: Audit linkage

Link important evidence to `AuditFacet` records.

## 8. Verification policy

Symmetry should run periodic checks:

- verify IPFS CID retrieval
- verify IPFS pin presence on expected nodes/providers
- verify Filecoin deal health
- verify Filecoin renewal horizon
- verify Arweave retrieval
- verify digest match across retrieved copies

This produces a persistence health score for each evidence item.

## 9. Repair policy

If one layer becomes unavailable:

- retrieve from another healthy layer
- verify digest match
- republish or renew the failed layer
- update manifest status
- emit audit record if needed

Examples:

- IPFS unavailable -> recover from Arweave or Filecoin -> re-pin
- Filecoin deal expired -> reseal from operational storage or IPFS/Arweave source -> renew manifest
- Arweave fetch issue -> verify from IPFS/Filecoin -> re-archive if the issue is persistence-side rather than gateway-side

## 10. Recommended minimum policy

For critical enterprise evidence:

- 1 operational encrypted copy
- 2 or more IPFS pinning targets
- 2 or more Filecoin replicas or managed replication policy
- 1 Arweave archival write
- 1 on-chain anchor

## 11. What this means for Symmetry

Symmetry is not just storing files.

Symmetry is creating:

- institutional evidence packages
- cryptographic continuity
- redundant retrievability
- repairable persistence
- sovereign auditability

That is the difference between ordinary document storage and resilience-grade evidence infrastructure.
