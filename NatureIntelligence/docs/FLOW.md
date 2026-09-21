# Tayrona integration flow

1. Download the official Tayrona boundary and calculate its geometry digest.
2. Register the polygon as `CO-TAYRONA-PNN-001` in the Nature workspace.
3. Discover Sentinel-2 L2A scenes through Copernicus STAC.
4. Request authenticated NDVI statistics for a current date range.
5. Compare current metrics with the workspace baseline and create typed alerts.
6. Prepare an evidence passport containing the source references and digest.
7. Send the typed alert to Áureo through `POST /integrations/nature/alerts`.
8. After HSK deployment, verify the `EnvironmentalAlertStarted` receipt in
   Blockscout. The pilot receipt is recorded in
   [`HSK-TESTNET-RECEIPT.md`](HSK-TESTNET-RECEIPT.md).

The Symmetry API routes are under `/nature`; the Áureo bridge route is
configured by `AUREO_BRIDGE_URL`. The EVM transaction stores references and
digests, never raw satellite imagery or the full polygon.
