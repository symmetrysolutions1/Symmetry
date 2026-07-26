import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { NatureMetrics, NatureService, PolygonGeometry } from "../services/nature.service";

@Controller("nature")
export class NatureController {
  constructor(private readonly natureService: NatureService) {}

  @Post("workspaces")
  createWorkspace(
    @Body()
    body: {
      enterpriseId: number;
      rootAddress: string;
      name: string;
      alertThresholds?: {
        treeCoverLossPercentagePoints?: number;
        ndviDrop?: number;
      };
    },
  ) {
    return this.natureService.createWorkspace(body);
  }

  @Get("workspaces/:workspaceId")
  getWorkspace(@Param("workspaceId") workspaceId: string) {
    return this.natureService.getWorkspace(workspaceId);
  }

  @Post("workspaces/:workspaceId/territories")
  registerTerritory(
    @Param("workspaceId") workspaceId: string,
    @Body()
    body: {
      territoryRef: string;
      name: string;
      geometry: PolygonGeometry;
      geometryDigest: string;
      areaHectares?: number;
      metadataUri?: string;
    },
  ) {
    return this.natureService.registerTerritory(workspaceId, body);
  }

  @Post("workspaces/:workspaceId/observations")
  recordObservation(
    @Param("workspaceId") workspaceId: string,
    @Body()
    body: {
      territoryId: string;
      source: string;
      capturedAt: string;
      metrics: NatureMetrics;
      evidenceUri: string;
      evidenceDigest: string;
    },
  ) {
    return this.natureService.recordObservation(workspaceId, body);
  }

  @Post("workspaces/:workspaceId/evidence-passports")
  prepareEvidencePassport(
    @Param("workspaceId") workspaceId: string,
    @Body()
    body: {
      observationId: string;
      alertId?: string;
      manifestUri: string;
      manifestDigest: string;
    },
  ) {
    return this.natureService.prepareEvidencePassport(workspaceId, body);
  }
}
