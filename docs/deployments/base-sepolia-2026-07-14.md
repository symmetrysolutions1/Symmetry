# Base Sepolia Deployment - 2026-07-14

## Verdict

The `0.2.0-security-hardened` release is functionally deployed and validated on Base Sepolia (`chainId 84532`). The Factory, official Symmetry test enterprise root, and one isolated E2E root for each service are live.

This is a successful and explorer-verified testnet rehearsal, not a production approval. The configured governance addresses are still EOAs rather than deployed Safe contracts.

## Release source

- Repository: `symmetrysolutions1/Symmetry` (private)
- Validated commit: `bd9bd9f75db4ef0b408065e125d58ae4d66e321f`
- GitHub CI: passed
- Foundry tests: 16 passed
- Node tests: 7 passed
- Static readiness: 46/46 passed
- Live testnet readiness: passed

## Core deployment

- EnterpriseRootFactory: [0x074349dbCa642fcc7517968Fb5548ecE6f2E456a](https://sepolia.basescan.org/address/0x074349dbCa642fcc7517968Fb5548ecE6f2E456a)
- Factory deployment transaction: [0x586cf95be65b7964f0331722bda12f180a995eb00e8ae963f3e604d8f71f9e07](https://sepolia.basescan.org/tx/0x586cf95be65b7964f0331722bda12f180a995eb00e8ae963f3e604d8f71f9e07)
- Factory owner: `0x03F4C13ce4d0beb4BD4554fC7BBaF36cb1f66b79`
- Authorized provisioner: `0xba136c070266D72aebFCcf26427132eb100d8E59`
- Registered roots after validation: `4`

## Explorer verification

- Basescan/Etherscan source publication: completed
- Shared facets, DiamondInit, and EnterpriseRootFactory: `14/14` verified
- Official and service E2E SymmetryDiamond roots: `4/4` verified
- Total verified addresses: `18/18`
- Compiler: Solidity `0.8.24`
- Optimizer runs: `200`

## Official enterprise root

- Root: [0x357eA4054Bcd387a677743A2021E9d1d45BC40F6](https://sepolia.basescan.org/address/0x357eA4054Bcd387a677743A2021E9d1d45BC40F6)
- Deployment transaction: [0xc30b49276df7a0891aad591e10eb51cdf9f2c8fac29c4c32d0ab4cebd36fc97e](https://sepolia.basescan.org/tx/0xc30b49276df7a0891aad591e10eb51cdf9f2c8fac29c4c32d0ab4cebd36fc97e)
- Company key: `0x91fe65197178b7293eadb629fcda5414445fe4b107bcd8ebbfbd11b5df4f999c`
- Local enterprise ID: `1`
- Enterprise admin and protocol admin: `0x03F4C13ce4d0beb4BD4554fC7BBaF36cb1f66b79`
- Enterprise owner: `0xFB689f3Ff9f27F6a7C3C5A68c95693cD8F48F6EF`
- Upgrade admin: `0x6e15FB78F611C90f58017F106669c10a6ae084F4`
- Corporate identity: active
- Enabled service mask: `7`
- Service entitlements: VotoID, Automation, and EUDR active
- Deployer protocol-admin role after handoff: revoked

## Service E2E roots

### Automation

- Root: [0x0fe2D7B5e9ADbefD9F8AaF2Fb83D36589BfA6B65](https://sepolia.basescan.org/address/0x0fe2D7B5e9ADbefD9F8AaF2Fb83D36589BfA6B65)
- Root transaction: [0x0b68cf39741a98b172d1a045172a7c68438a49dd3631cdd1533ead803c6309fb](https://sepolia.basescan.org/tx/0x0b68cf39741a98b172d1a045172a7c68438a49dd3631cdd1533ead803c6309fb)
- Terminal state: process instance `1` executed (`status 5`), checkpoint index `2`
- Evidence and audit IDs: `1` and `1`
- Receipts: `17/17` successful

### EUDR

- Root: [0xAA5024F9E70418447802ED54e3774Ae5db0865B1](https://sepolia.basescan.org/address/0xAA5024F9E70418447802ED54e3774Ae5db0865B1)
- Root transaction: [0xcc909a556b7ef609771262367911f0e5215eac8d03a8c6247832a20fb46e153d](https://sepolia.basescan.org/tx/0xcc909a556b7ef609771262367911f0e5215eac8d03a8c6247832a20fb46e153d)
- Terminal state: batch `1` certified (`status 4`), certificate `1` issued (`status 1`)
- Evidence and audit IDs: `1` and `1`
- Receipts: `18/18` successful

### VotoID

- Root: [0xf6b821E379eF8061307da557Be1d32A0D9D7829a](https://sepolia.basescan.org/address/0xf6b821E379eF8061307da557Be1d32A0D9D7829a)
- Root transaction: [0xe33b586767c97f8b833ce26ed3085af402de056bc9af3abe57db82a90e9f32c0](https://sepolia.basescan.org/tx/0xe33b586767c97f8b833ce26ed3085af402de056bc9af3abe57db82a90e9f32c0)
- Terminal state: proposal `1` verified (`status 7`), session `1` closed (`status 2`)
- Snapshot and result: `4` eligible voters, `3` yes, `1` no
- Evidence and audit IDs: `1` and `1`
- Receipts: phase 1 `20/20`, voting `5/5`, completion `8/8`

## Receipt integrity

- Factory deployment: `14/14`
- Official enterprise bootstrap: `10/10`
- Automation E2E: `17/17`
- EUDR E2E: `18/18`
- VotoID E2E: `33/33`
- Total: `92/92` successful receipts

## Confirmed event indexing

- Listener status: healthy
- Indexed addresses: Factory plus the four registered roots
- Confirmed safe head reached: `44126490`
- Raw replayable events ingested: `93`
- Provider-compatible effective range: `10` blocks per `eth_getLogs` request
- Canonical checkpoint and append-only JSONL event ledger: persisted locally
- Transient RPC timeout and rate-limit handling: bounded exponential retry enabled

## Remaining production gates

1. Replace testnet EOAs with deployed Safe multisigs and rehearse signer thresholds and recovery.
2. Rotate the deployer key before any production deployment because the current test key has been exposed outside a secret manager.
3. Replace placeholder `ipfs://` references with real canonical manifests replicated to IPFS, Filecoin, and Arweave, then run live health checks.
4. Run the confirmed event indexer, alerting, metrics, log retention, and evidence-health monitor continuously.
5. Complete independent smart-contract audit, remediation, incident-response rehearsal, and production cutover approval.

All critical Base Sepolia live gates pass. The remaining items are production gates and do not invalidate the completed testnet rehearsal.
