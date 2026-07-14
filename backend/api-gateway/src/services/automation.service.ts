import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";

type AutomationWorkspace = {
  workspaceId: string;
  enterpriseId: number;
  rootAddress: string;
  serviceConfigUri?: string;
  templates: ProcessTemplateDraft[];
  instances: ProcessInstanceDraft[];
  createdAt: string;
  updatedAt: string;
};

type ProcessTemplateDraft = {
  id: string;
  name: string;
  configUri: string;
  configDigest: string;
  checkpoints: ProcessCheckpointDraft[];
  active: boolean;
  createdAt: string;
};

type ProcessCheckpointDraft = {
  checkpointKey: string;
  requiredRole: string;
  evidenceRequired: boolean;
  oracleRequired: boolean;
};

type ProcessInstanceDraft = {
  id: string;
  templateId: string;
  externalRef: string;
  subjectType: string;
  subjectId: string;
  configUri: string;
  status: "active" | "waiting_oracle" | "executable" | "executed" | "failed" | "escalated" | "cancelled";
  currentCheckpointIndex: number;
  createdAt: string;
};

type CreateWorkspaceInput = {
  enterpriseId: number;
  rootAddress: string;
  serviceConfigUri?: string;
};

type CreateTemplateInput = {
  name: string;
  configUri: string;
  configDigest: string;
  checkpoints: ProcessCheckpointDraft[];
};

type CreateInstanceInput = {
  templateId: string;
  externalRef: string;
  subjectType: string;
  subjectId: string;
  configUri: string;
};

@Injectable()
export class AutomationService {
  private readonly workspaces = new Map<string, AutomationWorkspace>();

  createWorkspace(input: CreateWorkspaceInput): AutomationWorkspace {
    const now = new Date().toISOString();
    const workspace: AutomationWorkspace = {
      workspaceId: randomUUID(),
      enterpriseId: input.enterpriseId,
      rootAddress: input.rootAddress,
      serviceConfigUri: input.serviceConfigUri,
      templates: [],
      instances: [],
      createdAt: now,
      updatedAt: now,
    };

    this.workspaces.set(workspace.workspaceId, workspace);
    return workspace;
  }

  getWorkspace(workspaceId: string): AutomationWorkspace {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      throw new NotFoundException(`Automation workspace ${workspaceId} not found`);
    }
    return workspace;
  }

  createTemplate(workspaceId: string, input: CreateTemplateInput): ProcessTemplateDraft {
    const workspace = this.getWorkspace(workspaceId);
    const template: ProcessTemplateDraft = {
      id: randomUUID(),
      name: input.name,
      configUri: input.configUri,
      configDigest: input.configDigest,
      checkpoints: input.checkpoints,
      active: true,
      createdAt: new Date().toISOString(),
    };

    workspace.templates.push(template);
    workspace.updatedAt = new Date().toISOString();
    return template;
  }

  createInstance(workspaceId: string, input: CreateInstanceInput): ProcessInstanceDraft {
    const workspace = this.getWorkspace(workspaceId);
    const template = workspace.templates.find((item) => item.id === input.templateId);
    if (!template) {
      throw new NotFoundException(`Automation template ${input.templateId} not found`);
    }

    const instance: ProcessInstanceDraft = {
      id: randomUUID(),
      templateId: template.id,
      externalRef: input.externalRef,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      configUri: input.configUri,
      status: "active",
      currentCheckpointIndex: 0,
      createdAt: new Date().toISOString(),
    };

    workspace.instances.push(instance);
    workspace.updatedAt = new Date().toISOString();
    return instance;
  }
}
