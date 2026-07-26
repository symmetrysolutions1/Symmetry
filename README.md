# Symmetry Enterprises

**Verifiable operational infrastructure for companies and territories.**

Symmetry turns high-stakes operational data into decisions and evidence that organizations,
auditors, communities, and regulators can verify. Our first market focus is Nature Intelligence:
connecting geospatial observation, territorial validation, and environmental traceability to
help organizations monitor deforestation risk, demonstrate conservation results, and support
responsible supply chains.

Blockchain is the integrity backbone of the platform. It does not replace satellite analysis,
enterprise systems, or field knowledge. It anchors identities, permissions, evidence digests,
service state, and audit events so that critical claims preserve their origin and history.

## Product portfolio

- **Nature Intelligence:** territory registry, geospatial observations, change alerts, and
  environmental evidence passports.
- **EUDR and traceability:** parcel and supply-chain evidence for deforestation-free origin.
- **VotoID:** verifiable governance for boards and regulated decisions.
- **Automation:** auditable workflows, approvals, and compliance checkpoints.

All products share the same enterprise identity, evidence, audit, and service-governance
infrastructure. See [market positioning](docs/company/market-positioning.md).

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

- `VotoID`: hardened local and Base Sepolia E2E validated
- `Automation`: hardened local and Base Sepolia E2E validated
- `EUDR`: hardened local and Base Sepolia E2E validated
- Base Sepolia Factory, shared facets, and four enterprise roots: explorer verified

## Nature Intelligence prototype

Symmetry now includes an API-level Nature Intelligence MVP for registering GeoJSON
territories, recording source-attributed environmental observations, detecting material
tree-cover or NDVI changes, and preparing evidence passports.

- Product and API scope: [Nature Intelligence MVP](docs/products/nature-intelligence-mvp.md)
- Demonstration payload: [pilot-workspace.example.json](services/nature-intelligence/pilot-workspace.example.json)

Live Copernicus ingestion and raster analysis are explicitly future work; the current prototype
does not present demonstration metrics as live environmental results.

### Trust and evidence flow

```text
Earth observation + field validation + enterprise records
                         |
                         v
              analysis, alerts, and decisions
                         |
                         v
              canonical evidence manifest
                         |
                         v
        on-chain identity, digest, state, and audit anchor
```

Large geospatial files remain off-chain. Symmetry anchors their cryptographic digests and
manifest references so an organization can later prove which source, territory, analysis, and
validation produced a report or environmental claim.

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

Latest verified testnet status: [base-sepolia-2026-07-14.md](docs/deployments/base-sepolia-2026-07-14.md).

Production execution sequence: [production-execution-roadmap.md](docs/runbooks/production-execution-roadmap.md).

Required setup:

- copy [`.env.example`](.env.example) into local `.env`
- configure the canonical chain RPC and explorer API key
- configure deployer, protocol admin, upgrade admin, and enterprise owner wallets
- record deployment plans and deployment artifacts under `.deployments/`

Runbooks:

- [production-readiness-gate.md](docs/runbooks/production-readiness-gate.md)
- [production-execution-roadmap.md](docs/runbooks/production-execution-roadmap.md)
- [deployment-artifacts-and-network-deploys.md](docs/runbooks/deployment-artifacts-and-network-deploys.md)
- [enterprise-onboarding-e2e.md](docs/runbooks/enterprise-onboarding-e2e.md)
