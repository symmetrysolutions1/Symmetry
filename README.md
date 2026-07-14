# Symmetry Enterprises

Monorepo base for the Symmetry Enterprises protocol and enterprise operations platform.

## Canonical operating model

- `Symmetry` is the factory and orchestrator
- each enterprise gets its own root diamond
- services are installed per enterprise root, not globally
- evidence durability is multi-layer and manifest-aware
- chain choice is abstracted even when one chain family is canonical

## Layers

- `contracts/`: Diamond-based on-chain protocol
- `backend/`: NestJS services and API gateway
- `services/`: off-chain workflow and integration jobs
- `docs/`: architecture, operations and ADRs

## Current protocol scope

- `EnterpriseRegistryFacet`
- `AccessControlFacet`
- `CorporateIdentityFacet`
- `EvidenceFacet`
- `AuditFacet`
- `ServiceEntitlementFacet`

## First milestone

1. Deploy `SymmetryDiamond`
2. Register core facets
3. Initialize protocol admin
4. Onboard an enterprise in its own root
5. Create corporate identity
6. Enable services
7. Attach evidence and audit records

## Current validated service base

- `VotoID`: hardened local E2E validated; previous Base Sepolia run is legacy
- `Automation`: hardened local E2E validated; previous Base Sepolia run is legacy
- `EUDR`: hardened local E2E validated; previous Base Sepolia run is legacy

## Production gate

Main commands:

```powershell
pnpm contracts:build
pnpm contracts:fmt:check
pnpm contracts:sizes
pnpm contracts:test
pnpm contracts:check
pnpm build
pnpm test
pnpm readiness:check
```

Readiness is tiered:

```powershell
pnpm readiness:testnet
pnpm readiness:production
pnpm readiness:live -- --tier=testnet
```

The complete code-to-network sequence is documented in [release-cutover.md](docs/runbooks/release-cutover.md). GitHub publication is intentionally separate and documented in [github-publication.md](docs/runbooks/github-publication.md).

Latest verified status: [pre-deploy-readiness-2026-07-14.md](docs/pre-deploy-readiness-2026-07-14.md).

Required setup:

- copy [`.env.example`](.env.example) into local `.env`
- configure the canonical chain RPC and explorer API key
- configure deployer, protocol admin, upgrade admin, and enterprise owner wallets
- record deployment plans and deployment artifacts under `.deployments/`

Runbooks:

- [production-readiness-gate.md](docs/runbooks/production-readiness-gate.md)
- [deployment-artifacts-and-network-deploys.md](docs/runbooks/deployment-artifacts-and-network-deploys.md)
- [enterprise-onboarding-e2e.md](docs/runbooks/enterprise-onboarding-e2e.md)
