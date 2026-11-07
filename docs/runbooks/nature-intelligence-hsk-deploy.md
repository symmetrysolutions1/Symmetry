# Nature Intelligence → HSK Testnet runbook

This is the final network gate for the Tayrona pilot. It does not require a
private key to be stored in the repository or shared in chat.

## Network

- Chain: HSKChain Testnet
- Chain ID: `133`
- RPC: `https://testnet.hsk.xyz`
- Explorer: `https://testnet-explorer.hskchain.net`

## Before deployment

1. Fund the deployer wallet with HSK testnet tokens.
2. Confirm the public address in `SYMMETRY_DEPLOYER_WALLET`.
3. Run the read-only gate:

```powershell
node scripts/nature/check-hsk-readiness.mjs --phase=predeploy
```

The script checks the chain ID and public-wallet balance. It never reads or
prints `PRIVATE_KEY_DEPLOYER`.

## Deploy AureoCore

Use the deployment instructions and contract source in the Áureo repository:

```text
https://github.com/Sherikxd/aureo
```

Record the deployed `AureoCore` address and transaction hash. Do not call the
pilot complete until the address has bytecode on HSK Testnet.

## Connect Symmetry

Set these values only in the untracked local/hosting environment:

```dotenv
CHAIN_KEY=hsk-testnet
CHAIN_ID=133
RPC_URL_HSK_TESTNET=https://testnet.hsk.xyz
AUREO_CONTRACT_ADDRESS=0x<deployed-aureocore-address>
AUREO_EXPLORER_URL=https://testnet-explorer.hskchain.net
AUREO_BRIDGE_URL=<reachable-aureo-bridge-url>
```

Then verify the contract:

```powershell
node scripts/nature/check-hsk-readiness.mjs --phase=postdeploy
```

## Real alert receipt

1. Register `NatureIntelligence/assets/tayrona.geojson` as
   `CO-TAYRONA-PNN-001`.
2. Obtain a current Sentinel-2 observation and preserve its source URI and
   digest off-chain.
3. Record the observation and let the configured thresholds produce one typed
   alert.
4. Prepare the evidence passport.
5. Send one alert through `POST /nature/workspaces/:workspaceId/alerts/:alertId/anchor-aureo`.
6. Record the returned transaction hash and link it to
   `https://testnet-explorer.hskchain.net/tx/<hash>`.

The final submission evidence must show the Tayrona asset reference, alert
types, observation date, evidence digest, HSK transaction hash and Blockscout
receipt. Satellite imagery and the full polygon remain off-chain.
