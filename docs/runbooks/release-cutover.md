# Release Cutover

This runbook separates code readiness from network deployment. A green local gate never implies that mainnet is live.

## Stage 1 - Protocol hardening

- permissioned `EnterpriseRootFactory` provisioning
- two-step factory ownership handoff
- upgrade-admin approval plus enterprise-owner execution for every post-bootstrap diamond cut
- protocol-admin-only service entitlements
- service operations blocked when the service is disabled or the enterprise is inactive
- valid three-service bitmask enforcement

Required command:

```powershell
C:\Users\INICIO\.foundry\bin\forge.exe test
```

## Stage 2 - Deployment controls

- select `base-sepolia` for rehearsal or `base` for production
- use a fresh deployer key that has never appeared in chat, logs, or source control
- deploy Safe-compatible protocol and upgrade multisigs
- prepare a funded deployer provisioner
- run the static readiness gate

```powershell
pnpm readiness:testnet
pnpm readiness:production
```

The production command is expected to fail until all production-only values are real.

## Stage 3 - Evidence and indexing

For every critical evidence object:

1. build the draft manifest
2. replicate to operational storage, two IPFS pinning targets, two Filecoin deals, and Arweave
3. record provider receipts
4. prepare the canonical immutable anchor digest
5. submit that digest through `EvidenceFacet`
6. finalize the manifest with the successful on-chain receipt
7. run the live health checker
8. start the confirmed chain listener

```powershell
pnpm evidence:manifest -- '<json>'
pnpm evidence:prepare -- '<draft.json>' '<receipts.json>'
pnpm evidence:finalize -- '<prepared.json>' '<receipts-with-onchain.json>'
pnpm evidence:health -- '<anchored.json>' --live
pnpm indexers:poll -- --once
```

## Stage 4 - Full validation

```powershell
pnpm contracts:build
pnpm contracts:fmt:check
pnpm contracts:sizes
pnpm contracts:check
pnpm contracts:test
pnpm test:evidence
pnpm build
pnpm test:backend
pnpm lint
pnpm readiness:check
```

Review the release diff, secret scan, deployment plan, multisig addresses, and evidence provider receipts before broadcasting.

## Broadcast and post-deploy verification

Broadcast only after Stages 1-4 pass. Immediately after broadcast:

1. record the broadcast artifact with `pnpm deploy:record-factory`
2. update `FACTORY_ADDRESS`
3. run `node scripts/ops/check-live-deployment.mjs --tier=testnet` or `--tier=production`
4. publish and verify all source code in the explorer
5. run `pnpm deploy:check-verification -- '<artifact.json>' --write`
6. deploy one official enterprise root and execute the three E2E flows
7. start the continuous indexer and evidence health monitor

Production is approved only when both the static and live gates pass.
