const STAC_URL = process.env.COPERNICUS_STAC_URL
  ?? "https://stac.dataspace.copernicus.eu/v1";

const geometry = {
  type: "Polygon",
  coordinates: [[
    [-76.7, 1.1],
    [-76.6, 1.1],
    [-76.6, 1.2],
    [-76.7, 1.1],
  ]],
};

const to = process.argv[3] ?? new Date().toISOString();
const from = process.argv[2]
  ?? new Date(Date.parse(to) - (45 * 24 * 60 * 60 * 1000)).toISOString();

const response = await fetch(`${STAC_URL.replace(/\/$/, "")}/search`, {
  method: "POST",
  headers: {
    accept: "application/geo+json, application/json",
    "content-type": "application/json",
    "user-agent": "Symmetry-Nature-Intelligence/0.2",
  },
  body: JSON.stringify({
    collections: ["sentinel-2-l2a"],
    intersects: geometry,
    datetime: `${new Date(from).toISOString()}/${new Date(to).toISOString()}`,
    query: {
      "eo:cloud_cover": {
        lte: 30,
      },
    },
    sortby: [{
      field: "properties.datetime",
      direction: "desc",
    }],
    fields: {
      include: [
        "id",
        "collection",
        "bbox",
        "properties.datetime",
        "properties.eo:cloud_cover",
        "links",
      ],
    },
    limit: 5,
  }),
});

if (!response.ok) {
  throw new Error(`Copernicus STAC ${response.status}: ${(await response.text()).slice(0, 500)}`);
}

const payload = await response.json();
const scenes = payload.features.map((feature) => ({
  id: feature.id,
  collection: feature.collection,
  capturedAt: feature.properties?.datetime,
  cloudCoverPercentage: feature.properties?.["eo:cloud_cover"],
  sourceItemUrl: feature.links?.find((link) => link.rel === "self")?.href,
}));

console.log(JSON.stringify({
  provider: "copernicus-data-space-ecosystem",
  endpoint: STAC_URL,
  dateRange: { from, to },
  geometry,
  sceneCount: scenes.length,
  scenes,
}, null, 2));
