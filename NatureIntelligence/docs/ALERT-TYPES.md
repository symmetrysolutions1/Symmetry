# Alert types

Nature Intelligence produces typed observation signals. They do not establish
illegal activity, deforestation or fire by themselves.

| Type | Signal | Typical source |
| --- | --- | --- |
| `vegetation_loss` | Tree-cover percentage decrease | Baseline/current land-cover metrics |
| `ndvi_drop` | Vegetation-health decrease | Sentinel-2 B08/B04 NDVI |
| `water_change` | Water-index decrease or change | Sentinel-2 NDWI |
| `fire_signal` | Burned-area signal increase | Sentinel-2 fire bands |
| `human_activity` | Built-up signal increase | Urban/built-up spectral signal |

Each alert keeps the observation ID, reasons, severity, evidence URI and
manifest digest. Raw imagery and the territory polygon remain off-chain.

Severity is deterministic in the current MVP: `low`, `medium`, `high` or
`critical`. Thresholds are configured per workspace and must be reviewed by a
human before an operational decision.
