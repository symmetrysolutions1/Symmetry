# Evidence and Indexing Readiness

## Evidence scripts

- `pnpm evidence:manifest -- '<json>'`
- `pnpm evidence:health -- '<path-to-manifest>'`

These scripts support:

- evidence manifest generation
- replication health checks
- pre-anchor validation

## Indexing scripts

- `pnpm indexers:envelope -- '<json>'`

This creates a normalized event envelope for projections.

Catalog:

- [projection-catalog.json](../../indexers/projections/projection-catalog.json)

Monitoring policy:

- [alerts.policy.json](../../infra/monitoring/alerts.policy.json)
