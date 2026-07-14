# Chain Listener

Responsibility:

- subscribe to root deployment events
- subscribe to enterprise root domain events
- forward normalized envelopes to projection consumers

The production-minimum listener is `poll-chain-events.mjs`. It:

- waits for configurable confirmations
- scans the factory and configured enterprise roots
- persists a canonical block-hash checkpoint
- stops on checkpoint reorganization instead of silently corrupting projections
- appends raw, replayable event envelopes to a JSONL ledger

Run one confirmed pass with:

```powershell
pnpm indexers:poll -- --once
```

Normalized event envelope:

- chain key
- root address
- contract event name
- block number
- tx hash
- decoded payload
- ingestion timestamp
