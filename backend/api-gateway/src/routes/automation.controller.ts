import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { AutomationService } from "../services/automation.service";

type CreateAutomationWorkspaceBody = {
  enterpriseId: number;
  rootAddress: string;
  serviceConfigUri?: string;
};

type CreateTemplateBody = {
  name: string;
  configUri: string;
  configDigest: string;
  checkpoints: {
    checkpointKey: string;
    requiredRole: string;
    evidenceRequired: boolean;
    oracleRequired: boolean;
  }[];
};

type CreateInstanceBody = {
  templateId: string;
  externalRef: string;
  subjectType: string;
  subjectId: string;
  configUri: string;
};

@Controller("automation")
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Post("workspaces")
  createWorkspace(@Body() body: CreateAutomationWorkspaceBody) {
    return this.automationService.createWorkspace(body);
  }

  @Get("workspaces/:workspaceId")
  getWorkspace(@Param("workspaceId") workspaceId: string) {
    return this.automationService.getWorkspace(workspaceId);
  }

  @Post("workspaces/:workspaceId/templates")
  createTemplate(@Param("workspaceId") workspaceId: string, @Body() body: CreateTemplateBody) {
    return this.automationService.createTemplate(workspaceId, body);
  }

  @Post("workspaces/:workspaceId/instances")
  createInstance(@Param("workspaceId") workspaceId: string, @Body() body: CreateInstanceBody) {
    return this.automationService.createInstance(workspaceId, body);
  }
}
