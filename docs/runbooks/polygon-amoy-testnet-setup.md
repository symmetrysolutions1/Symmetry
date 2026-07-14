# Polygon Amoy Testnet Setup

## Current phase

The repository is currently in:

- local structure
- local contract compilation
- local Foundry E2E tests

It is **not** yet deployed to Polygon Amoy.

## Important clarification about wallets

If an address was only created in MetaMask, then it is currently:

- an EOA wallet
- not a multisig contract

So these addresses are valid as owners/admins for testnet setup, but they are not yet actual on-chain multisigs.

## What private keys are required now

For the first real testnet deployment, you only need:

- `PRIVATE_KEY_DEPLOYER`

Why:

- the deployer signs the deployment transactions
- the protocol admin and enterprise owner can be passed as addresses
- ownership can be handed off to those addresses during deployment

You do **not** need to place all wallet private keys in `.env`.

Recommended minimum:

- private key for deployer only
- admin/owner addresses as public addresses only

## What you need to get

### 1. Polygon Amoy RPC

Recommended path:

1. Log in to Alchemy dashboard.
2. Create a new app/project.
3. Select `Polygon Amoy`.
4. Copy:
   - HTTPS RPC URL
   - WebSocket URL

Put them into:

- `RPC_URL_POLYGON_AMOY`
- `WS_URL_POLYGON_AMOY`

Official references:

- [Alchemy Polygon Amoy RPC](https://www.alchemy.com/rpc/matic-amoy)
- [Polygon RPC endpoints](https://docs.polygon.technology/pos/reference/rpc-endpoints)

Polygon official public fallback values documented today:

- HTTPS: `https://polygon-amoy.drpc.org`
- WSS: `wss://polygon-amoy.drpc.org`
- Chain ID: `80002`
- Explorer: `https://amoy.polygonscan.com/`

These public endpoints are useful as backup, but for serious dev/test flows Alchemy is better.

### 2. PolygonScan API key

Use this for:

- contract verification
- explorer-integrated deployment flows

How to get it:

1. Create or log in to a PolygonScan account.
2. Go to API keys in dashboard.
3. Create a key for the project.

Put it into:

- `POLYGONSCAN_API_KEY`

Official references:

- [PolygonScan API key docs](https://docs.polygonscan.com/getting-started/viewing-api-usage-statistics)
- [PolygonScan endpoint URLs](https://docs.polygonscan.com/getting-started/endpoint-urls)

### 3. Testnet gas for the deployer

You need Amoy test tokens for:

- `SYMMETRY_DEPLOYER_WALLET`

Where to get them:

- [Alchemy Polygon Amoy Faucet](https://www.alchemy.com/faucets/polygon-amoy)

Notes from the faucet documentation:

- it currently offers `0.1 POL`
- claims are limited
- eligibility rules may apply

If one faucet fails, try the official Polygon faucet directory or other community faucets, but start with Alchemy.

### 4. Optional future multisig

For the first testnet deployment we can use:

- `SYMMETRY_UPGRADE_ADMIN_OWNER`
- `TEST_ENTERPRISE_OWNER`

as normal owner addresses.

Later, when you want real multisig control, we should deploy or configure a Safe-compatible multisig and then update:

- `SYMMETRY_UPGRADE_ADMIN_MULTISIG`
- `TEST_ENTERPRISE_MULTISIG`

## What to fill in `.env`

Minimum required for first testnet deployment:

- `PRIVATE_KEY_DEPLOYER`
- `RPC_URL_POLYGON_AMOY`
- `WS_URL_POLYGON_AMOY`
- `POLYGONSCAN_API_KEY`

Already known addresses:

- `SYMMETRY_DEPLOYER_WALLET`
- `SYMMETRY_PROTOCOL_ADMIN_WALLET`
- `SYMMETRY_UPGRADE_ADMIN_OWNER`
- `TEST_ENTERPRISE_OWNER`

## What to tell me after you configure it

Once you set the local `.env`, tell me:

1. `RPC and API keys are configured locally`
2. `deployer wallet has testnet POL`

Then I can prepare and run the actual Polygon Amoy deployment flow.
