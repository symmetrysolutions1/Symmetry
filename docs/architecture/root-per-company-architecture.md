# Root-Per-Company Architecture

## Decision

Symmetry is moving away from a multi-tenant protocol shell toward:

- `1 company = 1 root diamond`
- Symmetry as builder, deployer, and optional operator
- blockchain as trust, state, and integrity backbone
- multi-layer off-chain document permanence

## What remains inside Symmetry

Symmetry keeps:

- deployment tooling
- shared facet implementations
- factory and global deployment registry
- backend services
- document pipelines
- evidence distribution pipelines
- indexers and monitoring

The company does **not** live inside a shared Symmetry Diamond.

Instead:

- the company receives its own deployed root infrastructure
- the company root can still be deployed and maintained through Symmetry tooling

## New topology

### Global Symmetry layer

- `EnterpriseRootFactory`
- shared facet implementations
- backend and indexers
- permanence pipelines
- support and upgrade operations

### Company layer

Each company gets:

- one `SymmetryDiamond` as root
- one legal identity shell
- one permission plane
- one evidence layer
- one audit layer
- one service entitlement layer
- optional business-service facets

## Enterprise id vs diamond identity

The cleanest approach is:

- one root per company
- one local `enterpriseId` inside that root, usually `1`
- one global `companyKey` in the factory/registry
- one root address as canonical deployment identifier

So yes, the enterprise identity can remain aligned with the diamond, but in two scopes:

- local scope inside the company root
- global scope inside Symmetry's deployment registry

## Storage resilience model

Recommended permanence stack:

1. enterprise operational storage
2. IPFS pinned across multiple providers/nodes
3. Arweave archival permanence
4. on-chain hash anchoring on an EVM network

Using the same file across multiple permanence backends is valid and recommended.

The key is to preserve:

- same canonical digest
- same manifest id
- same provenance chain
- independent retrieval paths

## Network strategy

Do not confuse:

- execution chain
- document permanence network

The EVM execution chain stores:

- state
- hashes
- attestations
- authority
- events

The permanence networks store:

- the actual document payloads

## Current code direction

The repo now includes [EnterpriseRootFactory.sol](../../contracts/factory/EnterpriseRootFactory.sol) to align deployment with the root-per-company model while reusing the current Diamond core and shared facets.
