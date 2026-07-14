# Chain Anchoring Abstraction

## Decision

Symmetry uses `Polygon` as the initial primary execution chain.

Symmetry is **not** architected around Polygon as protocol identity.

The protocol identity is:

- enterprise root infrastructure
- identity layer
- evidence layer
- audit layer
- verification primitives
- service state anchoring

## Why this matters

If Symmetry is built around a single chain as philosophy, the protocol becomes brittle.

If Symmetry is built around anchoring primitives, the chain becomes:

- replaceable
- extensible
- interoperable

## Initial target

Current initial target:

- `Polygon PoS` for production-oriented execution
- `Polygon Amoy` for testnet

Config source:

- [anchors.config.json](../../infra/chains/anchors.config.json)

## What must stay chain-independent

- enterprise root model
- evidence manifests
- audit records
- service installation semantics
- subject typing
- verification workflows

## What can be chain-specific

- RPC endpoints
- deployment scripts
- explorer integrations
- gas assumptions
- relayer config
