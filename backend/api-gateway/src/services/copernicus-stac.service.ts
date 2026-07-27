import { BadGatewayException, BadRequestException, Injectable } from "@nestjs/common";
import type { PolygonGeometry } from "./nature.service";

export type CopernicusSceneSearchInput = {
  geometry: PolygonGeometry;
  from: string;
  to: string;
  maxCloudCover?: number;
  limit?: number;
};

export type CopernicusAsset = {
  href: string;
  type?: string;
  title?: string;
  roles?: string[];
};

export type CopernicusScene = {
  id: string;
  collection: string;
  capturedAt: string;
  cloudCoverPercentage?: number;
  bbox?: number[];
  geometry?: unknown;
  assets: Record<string, CopernicusAsset>;
  sourceItemUrl?: string;
};

type StacFeature = {
  id?: unknown;
  collection?: unknown;
  bbox?: unknown;
  geometry?: unknown;
  properties?: {
    datetime?: unknown;
    "eo:cloud_cover"?: unknown;
  };
  assets?: Record<string, {
    href?: unknown;
    type?: unknown;
    title?: unknown;
    roles?: unknown;
  }>;
  links?: Array<{
    rel?: unknown;
    href?: unknown;
  }>;
};

type StacFeatureCollection = {
  type?: unknown;
  features?: unknown;
};

const DEFAULT_STAC_URL = "https://stac.dataspace.copernicus.eu/v1";
const DEFAULT_TIMEOUT_MS = 15_000;

@Injectable()
export class CopernicusStacService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = this.resolveBaseUrl(process.env.COPERNICUS_STAC_URL);
  }

  async searchSentinel2L2A(input: CopernicusSceneSearchInput): Promise<CopernicusScene[]> {
    const from = this.parseDate(input.from, "from");
    const to = this.parseDate(input.to, "to");
    if (from.getTime() > to.getTime()) {
      throw new BadRequestException("Copernicus search from date must not be after to date");
    }

    const maxCloudCover = input.maxCloudCover ?? 30;
    if (maxCloudCover < 0 || maxCloudCover > 100) {
      throw new BadRequestException("Copernicus maxCloudCover must be between 0 and 100");
    }

    const limit = input.limit ?? 10;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException("Copernicus search limit must be an integer between 1 and 100");
    }

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), DEFAULT_TIMEOUT_MS);
    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: "POST",
        headers: {
          accept: "application/geo+json, application/json",
          "content-type": "application/json",
          "user-agent": "Symmetry-Nature-Intelligence/0.2",
        },
        body: JSON.stringify({
          collections: ["sentinel-2-l2a"],
          intersects: input.geometry,
          datetime: `${from.toISOString()}/${to.toISOString()}`,
          query: {
            "eo:cloud_cover": {
              lte: maxCloudCover,
            },
          },
          sortby: [{
            field: "properties.datetime",
            direction: "desc",
          }],
          limit,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const responseText = (await response.text()).slice(0, 500);
        throw new BadGatewayException(
          `Copernicus STAC search failed with ${response.status}: ${responseText || response.statusText}`,
        );
      }

      const payload = await response.json() as StacFeatureCollection;
      if (payload.type !== "FeatureCollection" || !Array.isArray(payload.features)) {
        throw new BadGatewayException("Copernicus STAC returned an invalid FeatureCollection");
      }

      return payload.features.map((feature) => this.normalizeScene(feature as StacFeature));
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof BadGatewayException) {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw new BadGatewayException("Copernicus STAC search timed out");
      }
      throw new BadGatewayException(
        `Copernicus STAC search could not be completed: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private normalizeScene(feature: StacFeature): CopernicusScene {
    if (
      typeof feature.id !== "string" ||
      typeof feature.collection !== "string" ||
      typeof feature.properties?.datetime !== "string"
    ) {
      throw new BadGatewayException("Copernicus STAC item is missing required identity or datetime fields");
    }

    const assets: Record<string, CopernicusAsset> = {};
    for (const [key, value] of Object.entries(feature.assets ?? {})) {
      if (typeof value.href !== "string") continue;
      assets[key] = {
        href: value.href,
        type: typeof value.type === "string" ? value.type : undefined,
        title: typeof value.title === "string" ? value.title : undefined,
        roles: Array.isArray(value.roles)
          ? value.roles.filter((role): role is string => typeof role === "string")
          : undefined,
      };
    }

    const sourceItemUrl = feature.links?.find(
      (link) => link.rel === "self" && typeof link.href === "string",
    )?.href;

    return {
      id: feature.id,
      collection: feature.collection,
      capturedAt: feature.properties.datetime,
      cloudCoverPercentage:
        typeof feature.properties["eo:cloud_cover"] === "number"
          ? feature.properties["eo:cloud_cover"]
          : undefined,
      bbox: Array.isArray(feature.bbox)
        ? feature.bbox.filter((coordinate): coordinate is number => typeof coordinate === "number")
        : undefined,
      geometry: feature.geometry,
      assets,
      sourceItemUrl: typeof sourceItemUrl === "string" ? sourceItemUrl : undefined,
    };
  }

  private parseDate(value: string, field: string): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`Copernicus search ${field} must be a valid ISO date`);
    }
    return parsed;
  }

  private resolveBaseUrl(value?: string): string {
    const candidate = value?.trim() || DEFAULT_STAC_URL;
    let parsed: URL;
    try {
      parsed = new URL(candidate);
    } catch {
      throw new Error("COPERNICUS_STAC_URL must be a valid URL");
    }
    if (parsed.protocol !== "https:") {
      throw new Error("COPERNICUS_STAC_URL must use HTTPS");
    }
    return parsed.toString().replace(/\/$/, "");
  }
}
