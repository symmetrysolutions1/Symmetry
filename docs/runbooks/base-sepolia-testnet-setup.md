# Base Sepolia Testnet Setup

## Current target

Symmetry now treats `Base` as the canonical execution family and `Base Sepolia` as the preferred first testnet for live rollout.

## Required environment values

Populate these in [`.env`](../../.env):

- `CHAIN_KEY=base-sepolia`
- `CHAIN_ID=84532`
- `RPC_URL_BASE_SEPOLIA=<your https rpc>`
- `RPC_URL_BASE=<optional mainnet rpc>`
- `ETHERSCAN_API_KEY=<recommended for forge verification>`
- `BASESCAN_API_KEY=<optional alias for internal tooling>`
- `PRIVATE_KEY_DEPLOYER=<already configured locally>`
- `FACTORY_ADDRESS=<filled after factory deployment>`

Recommended address values already present:

- `SYMMETRY_DEPLOYER_WALLET`
- `SYMMETRY_PROTOCOL_ADMIN_WALLET`
- `SYMMETRY_UPGRADE_ADMIN_OWNER`
- `TEST_ENTERPRISE_OWNER`

## Deployment sequence

1. Deploy `EnterpriseRootFactory`
2. Record deployment artifact
3. Set `FACTORY_ADDRESS`
4. Deploy Symmetry test enterprise root
5. Record root deployment artifact
6. Verify contracts in explorer
7. Exercise onboarding and the three services

## Suggested commands

Deploy factory:

```powershell
& 'C:\Users\INICIO\.foundry\bin\forge.exe' script scripts/foundry/DeployEnterpriseRootFactory.s.sol:DeployEnterpriseRootFactory --rpc-url $env:RPC_URL_BASE_SEPOLIA --broadcast
```

Deploy test enterprise root:

```powershell
& 'C:\Users\INICIO\.foundry\bin\forge.exe' script scripts/foundry/DeployTestEnterpriseRoot.s.sol:DeployTestEnterpriseRoot --rpc-url $env:RPC_URL_BASE_SEPOLIA --broadcast
```

## Notes

- `Base Sepolia` is the first live proving ground.
- `Polygon` stays available as a later expansion target.
- Explorer verification can be added once `ETHERSCAN_API_KEY` is configured.
