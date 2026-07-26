import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";

export type Position = [number, number];

export type PolygonGeometry = {
  type: "Polygon";
  coordinates: Position[][];
};

export type NatureMetrics = {
  treeCoverPercentage: number;
  ndviMean: number;
  cloudCoverPercentage: number;
};

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
};

type NatureAlert = {
  id: string;
  territoryId: string;
  observationId: string;
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
};

@Injectable()
export class NatureService {
  private readonly workspaces = new Map<string, NatureWorkspace>();

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

  private createAlertWhenThresholdExceeded(
    workspace: NatureWorkspace,
    observation: NatureObservation,
  ): NatureAlert | undefined {
    if (!observation.comparison) return undefined;

    const treeCoverLoss = Math.max(0, -observation.comparison.treeCoverChangePercentagePoints);
    const ndviDrop = Math.max(0, -observation.comparison.ndviChange);
    const reasons: string[] = [];

    if (treeCoverLoss >= workspace.alertThresholds.treeCoverLossPercentagePoints) {
      reasons.push(`Tree cover decreased by ${treeCoverLoss} percentage points`);
    }
    if (ndviDrop >= workspace.alertThresholds.ndviDrop) {
      reasons.push(`NDVI decreased by ${ndviDrop}`);
    }
    if (reasons.length === 0) return undefined;

    const severity =
      treeCoverLoss >= workspace.alertThresholds.treeCoverLossPercentagePoints * 2 ||
      ndviDrop >= workspace.alertThresholds.ndviDrop * 2
        ? "high"
        : "medium";
    const alert: NatureAlert = {
      id: randomUUID(),
      territoryId: observation.territoryId,
      observationId: observation.id,
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
    if (thresholds.treeCoverLossPercentagePoints <= 0 || thresholds.ndviDrop <= 0) {
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
      metrics.ndviMean > 1
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
