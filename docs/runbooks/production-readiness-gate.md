# Production Readiness Gate

This gate is the last stop before treating a Symmetry deployment as production-ready for a real enterprise.

## What this gate means

Passing this gate means:

- the monorepo is buildable
- the chain target is explicitly configured
- the deployer and admin actors are explicit
- deployment records exist and are reviewable
- the three base services have a known validation path
- evidence durability controls are defined

Passing this gate does **not** mean:

- explorer verification is optional
- multisig hardening is optional
- evidence has already been replicated to IPFS, Filecoin, and Arweave
- monitoring or indexers can be skipped

## Required local checks

Run these from [README.md](../../README.md):

```powershell
pnpm contracts:build
pnpm contracts:fmt:check
pnpm contracts:sizes
pnpm contracts:test
pnpm contracts:check
pnpm test:evidence
pnpm build
pnpm test:backend
pnpm readiness:check
```

## Required deployment controls

- `EnterpriseRootFactory` must be deployed and recorded as an artifact
- each company root must have its own deployment artifact
- ownership handoff must end in the enterprise multisig and the protocol upgrade admin
- the canonical chain key must be recorded in `.env`
- explorer API keys must be configured before final verification

## Required operational controls

- evidence manifests must be canonical and schema-valid
- `check-evidence-health.mjs` must pass for production evidence packages
- audit records must exist for service installation and material governance actions
- the confirmed chain listener must be active for the target chain and retain its canonical block checkpoint
- monitoring must alert on RPC failure, replication degradation, projection lag, and service changes without audit

## Human sign-off

Before go-live, confirm:

1. deployer wallet funding and key custody are correct
2. protocol admin and upgrade admin are the intended actors
3. enterprise multisig is deployed, funded, and tested
4. explorer verification completed successfully
5. at least one full E2E runbook execution succeeded on the target network family

## Current expectation

For Symmetry today, `Base` is the canonical execution family and `Base Sepolia` is the proving ground. Production mainnet should only proceed after this gate passes and the explorer verification plus multisig cutover are complete.

Use `release-cutover.md` for the exact four-stage sequence. A legacy factory correctly fails the testnet and production gates; do not weaken the gate to preserve an old deployment.
