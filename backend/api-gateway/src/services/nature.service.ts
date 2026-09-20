import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  CopernicusScene,
  CopernicusStacService,
} from "./copernicus-stac.service";
import {
  CopernicusNdviInterval,
  CopernicusStatisticsService,
} from "./copernicus-statistics.service";

export type Position = [number, number];

export type PolygonGeometry = {
  type: "Polygon";
  coordinates: Position[][];
};

export type NatureMetrics = {
  treeCoverPercentage: number;
  ndviMean: number;
  cloudCoverPercentage: number;
  ndwiMean?: number;
  burnedAreaPercentage?: number;
  builtUpPercentage?: number;
};

export type NatureAlertType =
  | "vegetation_loss"
  | "ndvi_drop"
  | "water_change"
  | "fire_signal"
  | "human_activity";

type NatureWorkspace = {
  workspaceId: string;
  enterpriseId: number;
  rootAddress: string;
  name: string;
  alertThresholds: AlertThresholds;
  territories: Territory[];
  observations: NatureObservation[];
  alerts: NatureAlert[];
  evidencePassports: EvidencePassport[];
  createdAt: string;
  updatedAt: string;
};

type AlertThresholds = {
  treeCoverLossPercentagePoints: number;
  ndviDrop: number;
  ndwiDrop: number;
  burnedAreaIncreasePercentagePoints: number;
  builtUpIncreasePercentagePoints: number;
};

type Territory = {
  id: string;
  territoryRef: string;
  name: string;
  geometry: PolygonGeometry;
  geometryDigest: string;
  areaHectares?: number;
  metadataUri?: string;
  createdAt: string;
};

type NatureObservation = {
  id: string;
  territoryId: string;
  source: string;
  capturedAt: string;
  metrics: NatureMetrics;
  evidenceUri: string;
  evidenceDigest: string;
  comparison?: ObservationComparison;
  createdAt: string;
};

type ObservationComparison = {
  previousObservationId: string;
  treeCoverChangePercentagePoints: number;
  ndviChange: number;
  ndwiChange?: number;
  burnedAreaChangePercentagePoints?: number;
  builtUpChangePercentagePoints?: number;
};

export type NatureAlert = {
  id: string;
  territoryId: string;
  observationId: string;
  types: NatureAlertType[];
  severity: "medium" | "high";
  status: "open" | "validated" | "dismissed";
  reasons: string[];
  createdAt: string;
};

type EvidencePassport = {
  id: string;
  territoryId: string;
  observationId: string;
  alertId?: string;
  manifestUri: string;
  manifestDigest: string;
  status: "prepared";
  createdAt: string;
};

type CreateWorkspaceInput = {
  enterpriseId: number;
  rootAddress: string;
  name: string;
  alertThresholds?: Partial<AlertThresholds>;
};

type RegisterTerritoryInput = {
  territoryRef: string;
  name: string;
  geometry: PolygonGeometry;
  geometryDigest: string;
  areaHectares?: number;
  metadataUri?: string;
};

type RecordObservationInput = {
  territoryId: string;
  source: string;
  capturedAt: string;
  metrics: NatureMetrics;
  evidenceUri: string;
  evidenceDigest: string;
};

type PreparePassportInput = {
  observationId: string;
  alertId?: string;
  manifestUri: string;
  manifestDigest: string;
};

const DEFAULT_THRESHOLDS: AlertThresholds = {
  treeCoverLossPercentagePoints: 1,
  ndviDrop: 0.1,
  ndwiDrop: 0.1,
  burnedAreaIncreasePercentagePoints: 1,
  builtUpIncreasePercentagePoints: 1,
};

@Injectable()
export class NatureService {
  private readonly workspaces = new Map<string, NatureWorkspace>();

  constructor(
    private readonly copernicusStacService: CopernicusStacService = new CopernicusStacService(),
    private readonly copernicusStatisticsService:
      CopernicusStatisticsService = new CopernicusStatisticsService(),
  ) {}

  createWorkspace(input: CreateWorkspaceInput): NatureWorkspace {
    if (!input.name?.trim()) {
      throw new BadRequestException("Nature workspace name is required");
    }

    const now = new Date().toISOString();
    const workspace: NatureWorkspace = {
      workspaceId: randomUUID(),
      enterpriseId: input.enterpriseId,
      rootAddress: input.rootAddress,
      name: input.name.trim(),
      alertThresholds: {
        ...DEFAULT_THRESHOLDS,
        ...input.alertThresholds,
      },
      territories: [],
      observations: [],
      alerts: [],
      evidencePassports: [],
      createdAt: now,
      updatedAt: now,
    };

    this.validateThresholds(workspace.alertThresholds);
    this.workspaces.set(workspace.workspaceId, workspace);
    return workspace;
  }

  getWorkspace(workspaceId: string): NatureWorkspace {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      throw new NotFoundException(`Nature workspace ${workspaceId} not found`);
    }
    return workspace;
  }

  buildAureoAlertPayload(
    workspaceId: string,
    alertId: string,
    evidence: { manifestUri: string; manifestDigest: string },
  ) {
    const workspace = this.getWorkspace(workspaceId);
    const alert = workspace.alerts.find((item) => item.id === alertId);
    if (!alert) {
      throw new NotFoundException(`Nature alert ${alertId} not found`);
    }
    const observation = workspace.observations.find((item) => item.id === alert.observationId);
    if (!observation) {
      throw new NotFoundException(`Nature observation ${alert.observationId} not found`);
    }
    const territory = this.requireTerritory(workspace, alert.territoryId);

    if (!evidence.manifestUri?.trim() || !evidence.manifestDigest?.trim()) {
      throw new BadRequestException("Aureo evidence manifest URI and digest are required");
    }

    return {
      assetRef: territory.territoryRef,
      asset: {
        id: territory.id,
        name: territory.name,
        geometryDigest: territory.geometryDigest,
      },
      alertId: alert.id,
      observationId: observation.id,
      alertTypes: alert.types,
      severity: alert.severity,
      reasons: alert.reasons,
      evidenceURI: evidence.manifestUri,
      evidenceDigest: evidence.manifestDigest,
      observation: {
        source: observation.source,
        capturedAt: observation.capturedAt,
        metrics: observation.metrics,
        comparison: observation.comparison,
      },
    };
  }

  registerTerritory(workspaceId: string, input: RegisterTerritoryInput): Territory {
    const workspace = this.getWorkspace(workspaceId);
    this.validatePolygon(input.geometry);

    if (workspace.territories.some((territory) => territory.territoryRef === input.territoryRef)) {
      throw new BadRequestException(`Territory reference ${input.territoryRef} already exists`);
    }

    const territory: Territory = {
      id: randomUUID(),
      ...input,
      createdAt: new Date().toISOString(),
    };
    workspace.territories.push(territory);
    workspace.updatedAt = territory.createdAt;
    return territory;
  }

  recordObservation(workspaceId: string, input: RecordObservationInput): NatureObservation {
    const workspace = this.getWorkspace(workspaceId);
    this.requireTerritory(workspace, input.territoryId);
    this.validateMetrics(input.metrics);

    const capturedAt = new Date(input.capturedAt);
    if (Number.isNaN(capturedAt.getTime())) {
      throw new BadRequestException("Observation capturedAt must be a valid ISO date");
    }

    const previous = workspace.observations
      .filter((observation) => observation.territoryId === input.territoryId)
      .sort((left, right) => Date.parse(right.capturedAt) - Date.parse(left.capturedAt))[0];

    const createdAt = new Date().toISOString();
    const observation: NatureObservation = {
      id: randomUUID(),
      ...input,
      capturedAt: capturedAt.toISOString(),
      comparison: previous
        ? {
            previousObservationId: previous.id,
            treeCoverChangePercentagePoints: this.round(
              input.metrics.treeCoverPercentage - previous.metrics.treeCoverPercentage,
            ),
            ndviChange: this.round(input.metrics.ndviMean - previous.metrics.ndviMean),
            ndwiChange:
              input.metrics.ndwiMean !== undefined && previous.metrics.ndwiMean !== undefined
                ? this.round(input.metrics.ndwiMean - previous.metrics.ndwiMean)
                : undefined,
            burnedAreaChangePercentagePoints:
              input.metrics.burnedAreaPercentage !== undefined &&
              previous.metrics.burnedAreaPercentage !== undefined
                ? this.round(
                    input.metrics.burnedAreaPercentage - previous.metrics.burnedAreaPercentage,
                  )
                : undefined,
            builtUpChangePercentagePoints:
              input.metrics.builtUpPercentage !== undefined &&
              previous.metrics.builtUpPercentage !== undefined
                ? this.round(input.metrics.builtUpPercentage - previous.metrics.builtUpPercentage)
                : undefined,
          }
        : undefined,
      createdAt,
    };

    workspace.observations.push(observation);
    this.createAlertWhenThresholdExceeded(workspace, observation);
    workspace.updatedAt = createdAt;
    return observation;
  }

  prepareEvidencePassport(workspaceId: string, input: PreparePassportInput): EvidencePassport {
    const workspace = this.getWorkspace(workspaceId);
    const observation = workspace.observations.find((item) => item.id === input.observationId);
    if (!observation) {
      throw new NotFoundException(`Nature observation ${input.observationId} not found`);
    }

    if (input.alertId) {
      const alert = workspace.alerts.find((item) => item.id === input.alertId);
      if (!alert || alert.observationId !== observation.id) {
        throw new BadRequestException("Evidence passport alert must belong to the observation");
      }
    }

    const passport: EvidencePassport = {
      id: randomUUID(),
      territoryId: observation.territoryId,
      observationId: observation.id,
      alertId: input.alertId,
      manifestUri: input.manifestUri,
      manifestDigest: input.manifestDigest,
      status: "prepared",
      createdAt: new Date().toISOString(),
    };

    workspace.evidencePassports.push(passport);
    workspace.updatedAt = passport.createdAt;
    return passport;
  }

  async searchCopernicusScenes(
    workspaceId: string,
    territoryId: string,
    input: {
      from: string;
      to: string;
      maxCloudCover?: number;
      limit?: number;
    },
  ): Promise<{
    provider: "copernicus-data-space-ecosystem";
    collection: "sentinel-2-l2a";
    territoryId: string;
    searchedAt: string;
    scenes: CopernicusScene[];
  }> {
    const workspace = this.getWorkspace(workspaceId);
    const territory = this.requireTerritory(workspace, territoryId);
    const scenes = await this.copernicusStacService.searchSentinel2L2A({
      geometry: territory.geometry,
      ...input,
    });

    return {
      provider: "copernicus-data-space-ecosystem",
      collection: "sentinel-2-l2a",
      territoryId,
      searchedAt: new Date().toISOString(),
      scenes,
    };
  }

  async calculateCopernicusNdvi(
    workspaceId: string,
    territoryId: string,
    input: {
      from: string;
      to: string;
      aggregationIntervalDays?: number;
      resolutionDegrees?: number;
      maxCloudCoverage?: number;
    },
  ): Promise<{
    provider: "copernicus-data-space-ecosystem";
    processor: "sentinel-hub-statistical-api";
    collection: "sentinel-2-l2a";
    territoryId: string;
    methodology: {
      index: "NDVI";
      bands: ["B08", "B04"];
      excludedSceneClasses: [3, 8, 9, 10, 11];
      aggregationInterval: string;
      resolutionDegrees: number;
    };
    intervals: CopernicusNdviInterval[];
  }> {
    const workspace = this.getWorkspace(workspaceId);
    const territory = this.requireTerritory(workspace, territoryId);
    const result = await this.copernicusStatisticsService.calculateNdvi({
      geometry: territory.geometry,
      ...input,
    });

    return {
      ...result,
      territoryId,
    };
  }

  private createAlertWhenThresholdExceeded(
    workspace: NatureWorkspace,
    observation: NatureObservation,
  ): NatureAlert | undefined {
    if (!observation.comparison) return undefined;

    const treeCoverLoss = Math.max(0, -observation.comparison.treeCoverChangePercentagePoints);
    const ndviDrop = Math.max(0, -observation.comparison.ndviChange);
    const ndwiDrop = Math.max(0, -(observation.comparison.ndwiChange ?? 0));
    const burnedAreaIncrease = Math.max(
      0,
      observation.comparison.burnedAreaChangePercentagePoints ?? 0,
    );
    const builtUpIncrease = Math.max(
      0,
      observation.comparison.builtUpChangePercentagePoints ?? 0,
    );
    const types: NatureAlertType[] = [];
    const reasons: string[] = [];

    if (treeCoverLoss >= workspace.alertThresholds.treeCoverLossPercentagePoints) {
      types.push("vegetation_loss");
      reasons.push(`Tree cover decreased by ${treeCoverLoss} percentage points`);
    }
    if (ndviDrop >= workspace.alertThresholds.ndviDrop) {
      types.push("ndvi_drop");
      reasons.push(`NDVI decreased by ${ndviDrop}`);
    }
    if (ndwiDrop >= workspace.alertThresholds.ndwiDrop) {
      types.push("water_change");
      reasons.push(`NDWI decreased by ${ndwiDrop}`);
    }
    if (burnedAreaIncrease >= workspace.alertThresholds.burnedAreaIncreasePercentagePoints) {
      types.push("fire_signal");
      reasons.push(`Burned-area signal increased by ${burnedAreaIncrease} percentage points`);
    }
    if (builtUpIncrease >= workspace.alertThresholds.builtUpIncreasePercentagePoints) {
      types.push("human_activity");
      reasons.push(`Built-up signal increased by ${builtUpIncrease} percentage points`);
    }
    if (reasons.length === 0) return undefined;

    const severity =
      treeCoverLoss >= workspace.alertThresholds.treeCoverLossPercentagePoints * 2 ||
      ndviDrop >= workspace.alertThresholds.ndviDrop * 2 ||
      ndwiDrop >= workspace.alertThresholds.ndwiDrop * 2 ||
      burnedAreaIncrease >= workspace.alertThresholds.burnedAreaIncreasePercentagePoints * 2 ||
      builtUpIncrease >= workspace.alertThresholds.builtUpIncreasePercentagePoints * 2
        ? "high"
        : "medium";
    const alert: NatureAlert = {
      id: randomUUID(),
      territoryId: observation.territoryId,
      observationId: observation.id,
      types,
      severity,
      status: "open",
      reasons,
      createdAt: new Date().toISOString(),
    };
    workspace.alerts.push(alert);
    return alert;
  }

  private requireTerritory(workspace: NatureWorkspace, territoryId: string): Territory {
    const territory = workspace.territories.find((item) => item.id === territoryId);
    if (!territory) {
      throw new NotFoundException(`Nature territory ${territoryId} not found`);
    }
    return territory;
  }

  private validateThresholds(thresholds: AlertThresholds): void {
    if (
      thresholds.treeCoverLossPercentagePoints <= 0 ||
      thresholds.ndviDrop <= 0 ||
      thresholds.ndwiDrop <= 0 ||
      thresholds.burnedAreaIncreasePercentagePoints <= 0 ||
      thresholds.builtUpIncreasePercentagePoints <= 0
    ) {
      throw new BadRequestException("Nature alert thresholds must be greater than zero");
    }
  }

  private validateMetrics(metrics: NatureMetrics): void {
    if (
      metrics.treeCoverPercentage < 0 ||
      metrics.treeCoverPercentage > 100 ||
      metrics.cloudCoverPercentage < 0 ||
      metrics.cloudCoverPercentage > 100 ||
      metrics.ndviMean < -1 ||
      metrics.ndviMean > 1 ||
      (metrics.ndwiMean !== undefined && (metrics.ndwiMean < -1 || metrics.ndwiMean > 1)) ||
      (metrics.burnedAreaPercentage !== undefined &&
        (metrics.burnedAreaPercentage < 0 || metrics.burnedAreaPercentage > 100)) ||
      (metrics.builtUpPercentage !== undefined &&
        (metrics.builtUpPercentage < 0 || metrics.builtUpPercentage > 100))
    ) {
      throw new BadRequestException("Nature observation metrics are outside their valid ranges");
    }
  }

  private validatePolygon(geometry: PolygonGeometry): void {
    if (geometry?.type !== "Polygon" || !Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
      throw new BadRequestException("Territory geometry must be a GeoJSON Polygon");
    }

    for (const ring of geometry.coordinates) {
      if (!Array.isArray(ring) || ring.length < 4) {
        throw new BadRequestException("Every polygon ring must contain at least four positions");
      }
      for (const position of ring) {
        if (
          !Array.isArray(position) ||
          position.length !== 2 ||
          position[0] < -180 ||
          position[0] > 180 ||
          position[1] < -90 ||
          position[1] > 90
        ) {
          throw new BadRequestException("Polygon positions must contain valid longitude and latitude");
        }
      }
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        throw new BadRequestException("Every polygon ring must be closed");
      }
    }
  }

  private round(value: number): number {
    return Math.round(value * 10_000) / 10_000;
  }
}
