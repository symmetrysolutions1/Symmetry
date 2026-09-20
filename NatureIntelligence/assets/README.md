# Tayrona asset

The operational boundary must come from the official Parques Nacionales
feature service. Run the fetch script from the repository root:

```bash
node NatureIntelligence/scripts/fetch-tayrona-asset.mjs
```

It writes:

- `NatureIntelligence/assets/tayrona.geojson`: the downloaded WGS84 FeatureCollection.
- `NatureIntelligence/assets/tayrona.asset.json`: the asset manifest and SHA-256 digest.

The exact polygon stays off-chain. Only the `geometryDigest`, asset reference,
alert type, evidence digest and evidence URI are sent to the EVM contract.
Do not replace the official geometry with a hand-drawn approximation.
