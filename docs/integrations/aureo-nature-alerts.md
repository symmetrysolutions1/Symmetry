# Nature Intelligence → Áureo alert bridge

Nature Intelligence treats each registered territory as an asset. When an
observation crosses a configured threshold, the workspace creates a typed
alert. The alert can be sent explicitly to Áureo for an on-chain integrity
anchor.

## Tayrona asset

The Copernicus Browser link used during the workshop is centered on Cali
(`lat=3.44362`, `lng=-76.47616`), so it is useful for the drawing workflow but
does not yet represent Tayrona. For the pilot, use the official Parques
Nacionales polygon and register it as one territory asset:

```text
https://mapas.parquesnacionales.gov.co/arcgis/rest/services/pnn/Limites_oficiales_Poligono/FeatureServer/0/query?where=ap_nombre%3D%27Tayrona%27&outFields=*&returnGeometry=true&outSR=4326&f=geojson
```

The returned feature is `Tayrona`, category `Parque Nacional Natural`, in
WGS84. The resulting GeoJSON `geometry` is sent to
`POST /nature/workspaces/:workspaceId/territories` with a stable reference such
as `CO-TAYRONA-PNN-001` and a digest of the exact geometry. Copernicus then
uses that same geometry in its STAC and Statistical API requests, so the
observations and alerts refer to the same asset boundary.

## Flow

```text
GeoJSON territory asset
  → Sentinel-2 observation
  → typed Nature alert
  → evidence manifest
  → Aureo environmental alert
  → EVM transaction and explorer receipt
```

## Bridge route

```text
POST /nature/workspaces/:workspaceId/alerts/:alertId/anchor-aureo
```

Body:

```json
{
  "manifestUri": "nature://tayrona/passport-1",
  "manifestDigest": "0x1111111111111111111111111111111111111111111111111111111111111111",
  "aureoUrl": "http://127.0.0.1:3000/integrations/nature/alerts"
}
```

The bridge sends the asset reference, alert types, severity, reasons,
observation summary and manifest digest. It never sends raw imagery or the
territory polygon to the blockchain endpoint. Configure `AUREO_BRIDGE_URL` if
the URL is not supplied per request.

Supported alert types are `vegetation_loss`, `ndvi_drop`, `water_change`,
`fire_signal` and `human_activity`. These are signals requiring interpretation
and, where appropriate, field validation; they are not automatic findings of
illegal activity or confirmed deforestation.
