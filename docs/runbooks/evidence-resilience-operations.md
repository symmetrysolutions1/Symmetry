# Evidence Resilience Operations

## Goal

Operate Symmetry evidence with the strongest practical guarantee of:

- immutability
- destruction resistance
- long-term durability

using:

- operational storage
- IPFS
- Filecoin
- Arweave
- on-chain anchoring

## Required outputs for critical evidence

Every critical evidence object must produce:

1. canonical file or bundle
2. canonical `keccak256` digest
3. one evidence manifest
4. one operational storage copy
5. at least two IPFS pinning targets
6. at least two Filecoin replicas or equivalent managed replication
7. one Arweave archive
8. one on-chain evidence anchor

## Success criteria

Evidence is considered healthy only if:

- digest matches across retrieved copies
- IPFS pinning targets meet threshold
- Filecoin replica count meets threshold
- Arweave retrieval succeeds
- on-chain anchor digest matches manifest digest

## Degraded state

Evidence enters degraded state if any one of these occurs:

- fewer than two healthy IPFS pinning targets
- fewer than two active Filecoin replicas
- Arweave retrieval failure
- digest mismatch between layers
- missing on-chain anchor for a required object

## Repair actions

### IPFS degraded

- fetch from operational storage, Filecoin, or Arweave
- verify digest
- re-pin to required targets
- update manifest verification fields

### Filecoin degraded

- rebuild payload source from operational storage or other healthy layer
- renew or recreate deals
- update `filecoinDealIds`
- update manifest verification fields

### Arweave degraded

- recover canonical payload from healthy layer
- verify digest
- re-archive
- update `arweaveTxId` only if a new archive object is needed and track supersession explicitly

### On-chain anchor missing or stale

- verify canonical manifest digest
- anchor through `EvidenceFacet`
- record audit event

## Repo artifacts

- schema:
  - [evidence-manifest.schema.json](../../sdk/schemas/evidence-manifest.schema.json)
- default policy:
  - [persistence-profile.default.json](../../storage/object-store/persistence-profile.default.json)
- ipfs policy:
  - [pinning-policy.json](../../storage/ipfs/pinning-policy.json)
- filecoin policy:
  - [deal-policy.json](../../storage/filecoin/deal-policy.json)
- arweave policy:
  - [archive-policy.json](../../storage/arweave/archive-policy.json)
- manifest example:
  - [evidence-manifest.example.json](../../services/evidence-normalizer/evidence-manifest.example.json)
