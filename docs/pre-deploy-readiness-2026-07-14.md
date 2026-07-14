# Pre-Deploy Readiness Record

Date: 2026-07-14

## Decision

The hardened Symmetry release is ready for a fresh Base Sepolia deployment rehearsal.

This decision does not approve the legacy Base Sepolia Factory, Base mainnet, or real customer operations.

## Stage Results

### 1. Protocol hardening - complete

- permissioned Factory provisioning and two-step ownership handoff
- dual-authority Diamond upgrades
- protocol-controlled service entitlements
- inactive enterprise and disabled service enforcement
- valid three-service mask enforcement
- 16 of 16 Foundry tests passing

### 2. Deployment controls - code complete, network cutover pending

- tiered local, testnet, production, and live gates
- deployment artifact recording and validation
- explorer verification checker
- deployable contract size gate
- all deployable contracts are below EVM runtime and initcode limits
- the existing Base Sepolia Factory is intentionally classified as legacy and incompatible

### 3. Evidence and indexing - locally complete

- deterministic canonical JSON scope and Keccak-256 anchor digest
- immutable payload tamper detection
- prepared and finalized evidence manifest pipeline
- IPFS, Filecoin, Arweave, operational storage, and on-chain receipt model
- confirmed event listener with block-hash checkpoint and reorg detection
- automatic Alchemy Free `eth_getLogs` range adaptation
- live Base Sepolia RPC polling completed successfully

### 4. Full validation - complete for pre-deploy scope

- 40 Solidity files and 40 deployable contracts compiled
- Solidity format check passing
- NestJS workspaces build and typecheck cleanly
- 7 of 7 Node tests passing
- API Gateway runtime import issue corrected
- API Gateway `/health` smoke test passing
- local readiness gate: 46 of 46 checks passing
- source candidate secret scan clean
- GitHub-facing documentation uses relative links
- local E14 repository, runtime outputs, generated evidence, and environment secrets are ignored

## Required Next Actions

1. Deploy the hardened Factory and shared facets to Base Sepolia.
2. Record the complete deployment artifact and replace the legacy `FACTORY_ADDRESS`.
3. Verify every deployed contract in the explorer.
4. Deploy one official Symmetry enterprise root and run onboarding plus all three service E2E flows.
5. Run the static and live testnet gates until both pass.

## Production-Only Blockers

- deploy real Safe-compatible protocol, upgrade, and enterprise multisigs
- rotate every deployer/API credential that has appeared in chat or logs
- configure Base mainnet and fund a fresh production deployer
- configure real IPFS pinning, Filecoin deals, Arweave writes, and health receipts
- replace in-memory backend state with durable persistence, authentication, authorization, workers, and production observability
- complete independent smart-contract and infrastructure security audits

## Known Non-Code Warning

Foundry cannot write its optional global signature cache under the current Windows account. This does not affect compilation or test execution.
