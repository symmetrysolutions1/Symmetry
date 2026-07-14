# Deployment Artifacts and Network-Aware Deploys

## Goal

Make every deployment reproducible, reviewable, and portable across supported chains.

## Scripts

- `pnpm deploy:plan`
- `pnpm deploy:artifact -- '<json>'`
- Foundry:
  - [DeployEnterpriseRootFactory.s.sol](../../scripts/foundry/DeployEnterpriseRootFactory.s.sol)
  - [DeployTestEnterpriseRoot.s.sol](../../scripts/foundry/DeployTestEnterpriseRoot.s.sol)

## Artifacts

Schema:

- [artifacts.schema.json](../../infra/deployments/artifacts.schema.json)

Outputs should be stored under:

- `.deployments/plans/<chain-key>/`
- `.deployments/records/<chain-key>/`

## Why this matters

- deployment history becomes auditable
- ownership handoff becomes traceable
- enterprise roots can be reconstructed by artifact, not memory
