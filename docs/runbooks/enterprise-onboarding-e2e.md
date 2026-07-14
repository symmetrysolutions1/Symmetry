# Enterprise Onboarding E2E

## Goal

Validate the first end-to-end onboarding slice for a Symmetry customer company across:

- off-chain enterprise workspace provisioning
- enterprise registration in the Diamond
- identity creation
- service enablement
- evidence anchoring
- audit creation

## What exists today

### Off-chain

- `backend/api-gateway`
- `backend/identity-service`
- enterprise provision script:
  - `scripts/ops/provision-enterprise-root.mjs`

### On-chain

- `SymmetryDiamond`
- `DiamondCutFacet`
- `DiamondLoupeFacet`
- `OwnershipFacet`
- `DiamondInit`
- `EnterpriseRegistryFacet`
- `AccessControlFacet`
- `CorporateIdentityFacet`
- `EvidenceFacet`
- `AuditFacet`
- `ServiceEntitlementFacet`

## E2E steps

### 1. Provision enterprise workspace

Run:

```powershell
pnpm enterprise:provision
```

This creates:

- `storage/object-store/enterprises/<enterprise-slug>/identity`
- `storage/object-store/enterprises/<enterprise-slug>/evidence`
- `storage/object-store/enterprises/<enterprise-slug>/audit`
- service-specific folders for `votoid`, `automation`, `eudr`

### 2. Deploy and wire the Diamond

Run later with Foundry:

```powershell
forge script scripts/foundry/DeploySymmetry.s.sol --rpc-url %RPC_URL% --broadcast
```

### 3. Onboard enterprise on-chain

Expected sequence:

1. `onboardEnterprise`
2. `createCorporateIdentity`
3. `grantEnterpriseRole`
4. `bindEnterpriseWallet`
5. `authorizeSigner`
6. `configureEnterpriseService`
7. `anchorEvidence`
8. `createAuditRecord`

### 4. Verify final state

Must verify:

- enterprise exists
- admin and multisig registered
- corporate identity exists
- wallet binding exists
- service entitlement exists
- evidence anchored
- audit record linked

## Current verification status

- NestJS build, service tests, and HTTP health smoke test pass
- deployable Solidity contracts compile and remain within EVM size limits
- `tests/foundry/EnterpriseOnboardingFlow.t.sol` passes
- the hardened Factory/root still requires a fresh Base Sepolia deployment and live E2E validation
