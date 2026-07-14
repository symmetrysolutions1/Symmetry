import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { EudrService } from "../services/eudr.service";

@Controller("eudr")
export class EudrController {
  constructor(private readonly eudrService: EudrService) {}

  @Post("workspaces")
  createWorkspace(@Body() body: { enterpriseId: number; rootAddress: string; serviceConfigUri?: string }) {
    return this.eudrService.createWorkspace(body);
  }

  @Get("workspaces/:workspaceId")
  getWorkspace(@Param("workspaceId") workspaceId: string) {
    return this.eudrService.getWorkspace(workspaceId);
  }

  @Post("workspaces/:workspaceId/actors")
  registerActor(
    @Param("workspaceId") workspaceId: string,
    @Body() body: { account: string; roleKey: string; legalName: string; metadataUri: string },
  ) {
    return this.eudrService.registerActor(workspaceId, body);
  }

  @Post("workspaces/:workspaceId/parcels")
  registerParcel(
    @Param("workspaceId") workspaceId: string,
    @Body() body: { parcelRef: string; geoDigest: string; metadataUri: string },
  ) {
    return this.eudrService.registerParcel(workspaceId, body);
  }

  @Post("workspaces/:workspaceId/batches")
  createBatch(
    @Param("workspaceId") workspaceId: string,
    @Body()
    body: {
      batchRef: string;
      parcelId: string;
      quantity: number;
      unit: string;
      dossierManifestUri: string;
      dossierManifestDigest: string;
      currentCustodian: string;
    },
  ) {
    return this.eudrService.createBatch(workspaceId, body);
  }

  @Post("workspaces/:workspaceId/certificates")
  issueCertificate(
    @Param("workspaceId") workspaceId: string,
    @Body() body: { batchId: string; certificateUri: string; passportUri: string; manifestDigest: string },
  ) {
    return this.eudrService.issueCertificate(workspaceId, body);
  }
}
