import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { PolygonGeometry } from "./nature.service";

export type CopernicusNdviInput = {
  geometry: PolygonGeometry;
  from: string;
  to: string;
  aggregationIntervalDays?: number;
  resolutionDegrees?: number;
  maxCloudCoverage?: number;
};

export type CopernicusNdviInterval = {
  from: string;
  to: string;
  mean?: number;
  min?: number;
  max?: number;
  standardDeviation?: number;
  sampleCount?: number;
  noDataCount?: number;
};

type TokenResponse = {
  access_token?: unknown;
  expires_in?: unknown;
};

type StatisticsResponse = {
  data?: Array<{
    interval?: {
      from?: unknown;
      to?: unknown;
    };
    outputs?: {
      ndvi?: {
        bands?: {
          B0?: {
            stats?: {
              mean?: unknown;
              min?: unknown;
              max?: unknown;
              stDev?: unknown;
              sampleCount?: unknown;
              noDataCount?: unknown;
            };
          };
        };
      };
    };
  }>;
  status?: unknown;
};

const TOKEN_URL =
  "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token";
const STATISTICS_URL = "https://sh.dataspace.copernicus.eu/statistics/v1";
const REQUEST_TIMEOUT_MS = 30_000;

const NDVI_EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: [{
      bands: ["B04", "B08", "SCL", "dataMask"]
    }],
    output: [
      {
        id: "ndvi",
        bands: 1,
        sampleType: "FLOAT32"
      },
      {
        id: "dataMask",
        bands: 1
      }
    ]
  };
}

function evaluatePixel(sample) {
  var denominator = sample.B08 + sample.B04;
  var validSpectralValue = denominator !== 0;
  var cloudOrShadow = [3, 8, 9, 10, 11].includes(sample.SCL);
  var valid = sample.dataMask && validSpectralValue && !cloudOrShadow;
  return {
    ndvi: [valid ? (sample.B08 - sample.B04) / denominator : 0],
    dataMask: [valid ? 1 : 0]
  };
}`;

@Injectable()
export class CopernicusStatisticsService {
  private accessToken?: string;
  private tokenExpiresAt = 0;

  async calculateNdvi(input: CopernicusNdviInput): Promise<{
    provider: "copernicus-data-space-ecosystem";
    processor: "sentinel-hub-statistical-api";
    collection: "sentinel-2-l2a";
    methodology: {
      index: "NDVI";
      bands: ["B08", "B04"];
      excludedSceneClasses: [3, 8, 9, 10, 11];
      aggregationInterval: string;
      resolutionDegrees: number;
    };
    intervals: CopernicusNdviInterval[];
  }> {
    const from = this.parseDate(input.from, "from");
    const to = this.parseDate(input.to, "to");
    if (from.getTime() > to.getTime()) {
      throw new BadRequestException("Copernicus NDVI from date must not be after to date");
    }

    const aggregationIntervalDays = input.aggregationIntervalDays ?? 5;
    if (
      !Number.isInteger(aggregationIntervalDays) ||
      aggregationIntervalDays < 1 ||
      aggregationIntervalDays > 90
    ) {
      throw new BadRequestException("NDVI aggregationIntervalDays must be between 1 and 90");
    }

    const resolutionDegrees = input.resolutionDegrees ?? 0.0002;
    if (resolutionDegrees <= 0 || resolutionDegrees > 0.01) {
      throw new BadRequestException("NDVI resolutionDegrees must be greater than 0 and at most 0.01");
    }

    const maxCloudCoverage = input.maxCloudCoverage ?? 30;
    if (maxCloudCoverage < 0 || maxCloudCoverage > 100) {
      throw new BadRequestException("NDVI maxCloudCoverage must be between 0 and 100");
    }

    const accessToken = await this.getAccessToken();
    const payload = await this.requestJson<StatisticsResponse>(
      STATISTICS_URL,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
          "user-agent": "Symmetry-Nature-Intelligence/0.2",
        },
        body: JSON.stringify({
          input: {
            bounds: {
              geometry: input.geometry,
              properties: {
                crs: "http://www.opengis.net/def/crs/OGC/1.3/CRS84",
              },
            },
            data: [{
              type: "sentinel-2-l2a",
              dataFilter: {
                maxCloudCoverage,
                mosaickingOrder: "leastCC",
              },
            }],
          },
          aggregation: {
            timeRange: {
              from: from.toISOString(),
              to: to.toISOString(),
            },
            aggregationInterval: {
              of: `P${aggregationIntervalDays}D`,
            },
            evalscript: NDVI_EVALSCRIPT,
            resx: resolutionDegrees,
            resy: resolutionDegrees,
          },
        }),
      },
      "Copernicus Statistical API",
    );

    if (!Array.isArray(payload.data)) {
      throw new BadGatewayException("Copernicus Statistical API returned an invalid data series");
    }

    return {
      provider: "copernicus-data-space-ecosystem",
      processor: "sentinel-hub-statistical-api",
      collection: "sentinel-2-l2a",
      methodology: {
        index: "NDVI",
        bands: ["B08", "B04"],
        excludedSceneClasses: [3, 8, 9, 10, 11],
        aggregationInterval: `P${aggregationIntervalDays}D`,
        resolutionDegrees,
      },
      intervals: payload.data.map((interval) => {
        const stats = interval.outputs?.ndvi?.bands?.B0?.stats;
        return {
          from: this.requireString(interval.interval?.from, "NDVI interval from"),
          to: this.requireString(interval.interval?.to, "NDVI interval to"),
          mean: this.optionalNumber(stats?.mean),
          min: this.optionalNumber(stats?.min),
          max: this.optionalNumber(stats?.max),
          standardDeviation: this.optionalNumber(stats?.stDev),
          sampleCount: this.optionalNumber(stats?.sampleCount),
          noDataCount: this.optionalNumber(stats?.noDataCount),
        };
      }),
    };
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const clientId = process.env.COPERNICUS_CLIENT_ID?.trim();
    const clientSecret = process.env.COPERNICUS_CLIENT_SECRET?.trim();
    if (!clientId || !clientSecret) {
      throw new ServiceUnavailableException(
        "Copernicus NDVI processing requires COPERNICUS_CLIENT_ID and COPERNICUS_CLIENT_SECRET",
      );
    }

    const form = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    });
    const payload = await this.requestJson<TokenResponse>(
      TOKEN_URL,
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      },
      "Copernicus OAuth",
    );

    if (typeof payload.access_token !== "string") {
      throw new BadGatewayException("Copernicus OAuth did not return an access token");
    }
    const expiresIn = typeof payload.expires_in === "number" ? payload.expires_in : 600;
    this.accessToken = payload.access_token;
    this.tokenExpiresAt = Date.now() + Math.max(30, expiresIn - 60) * 1000;
    return this.accessToken;
  }

  private async requestJson<T>(
    url: string,
    init: RequestInit,
    label: string,
  ): Promise<T> {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        ...init,
        signal: abortController.signal,
      });
      if (!response.ok) {
        const responseText = (await response.text()).slice(0, 500);
        throw new BadGatewayException(
          `${label} failed with ${response.status}: ${responseText || response.statusText}`,
        );
      }
      return await response.json() as T;
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new BadGatewayException(`${label} timed out`);
      }
      throw new BadGatewayException(
        `${label} could not be completed: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseDate(value: string, field: string): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`Copernicus NDVI ${field} must be a valid ISO date`);
    }
    return parsed;
  }

  private requireString(value: unknown, label: string): string {
    if (typeof value !== "string") {
      throw new BadGatewayException(`${label} is missing`);
    }
    return value;
  }

  private optionalNumber(value: unknown): number | undefined {
    return typeof value === "number" ? value : undefined;
  }
}
