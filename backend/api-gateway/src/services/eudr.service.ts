import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";

type EudrWorkspace = {
  workspaceId: string;
  enterpriseId: number;
  rootAddress: string;
  serviceConfigUri?: string;
  actors: SupplyActorDraft[];
  parcels: ParcelDraft[];
  batches: BatchDraft[];
  certificates: CertificateDraft[];
  createdAt: string;
  updatedAt: string;
};

type SupplyActorDraft = {
  id: string;
  account: string;
  roleKey: string;
  legalName: string;
  metadataUri: string;
};

type ParcelDraft = {
  id: string;
  parcelRef: string;
  geoDigest: string;
  metadataUri: string;
};

type BatchDraft = {
  id: string;
  batchRef: string;
  parcelId: string;
  quantity: number;
  unit: string;
  dossierManifestUri: string;
  dossierManifestDigest: string;
  currentCustodian: string;
  riskScore?: number;
  status: "created" | "in_transit" | "validated" | "certified" | "rejected";
  certificateId?: string;
};

type CertificateDraft = {
  id: string;
  batchId: string;
  certificateUri: string;
  passportUri: string;
  manifestDigest: string;
  status: "issued" | "revoked";
};

type CreateWorkspaceInput = {
  enterpriseId: number;
  rootAddress: string;
  serviceConfigUri?: string;
};

@Injectable()
export class EudrService {
  private readonly workspaces = new Map<string, EudrWorkspace>();

  createWorkspace(input: CreateWorkspaceInput): EudrWorkspace {
    const now = new Date().toISOString();
    const workspace: EudrWorkspace = {
      workspaceId: randomUUID(),
      enterpriseId: input.enterpriseId,
      rootAddress: input.rootAddress,
      serviceConfigUri: input.serviceConfigUri,
      actors: [],
      parcels: [],
      batches: [],
      certificates: [],
      createdAt: now,
      updatedAt: now,
    };

    this.workspaces.set(workspace.workspaceId, workspace);
    return workspace;
  }

  getWorkspace(workspaceId: string): EudrWorkspace {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      throw new NotFoundException(`EUDR workspace ${workspaceId} not found`);
    }
    return workspace;
  }

  registerActor(workspaceId: string, actor: Omit<SupplyActorDraft, "id">): SupplyActorDraft {
    const workspace = this.getWorkspace(workspaceId);
    const draft = { id: randomUUID(), ...actor };
    workspace.actors.push(draft);
    workspace.updatedAt = new Date().toISOString();
    return draft;
  }

  registerParcel(workspaceId: string, parcel: Omit<ParcelDraft, "id">): ParcelDraft {
    const workspace = this.getWorkspace(workspaceId);
    const draft = { id: randomUUID(), ...parcel };
    workspace.parcels.push(draft);
    workspace.updatedAt = new Date().toISOString();
    return draft;
  }

  createBatch(workspaceId: string, batch: Omit<BatchDraft, "id" | "status">): BatchDraft {
    const workspace = this.getWorkspace(workspaceId);
    const draft: BatchDraft = { id: randomUUID(), status: "created", ...batch };
    workspace.batches.push(draft);
    workspace.updatedAt = new Date().toISOString();
    return draft;
  }

  issueCertificate(workspaceId: string, certificate: Omit<CertificateDraft, "id" | "status">): CertificateDraft {
    const workspace = this.getWorkspace(workspaceId);
    const batch = workspace.batches.find((item) => item.id === certificate.batchId);
    if (!batch) {
      throw new NotFoundException(`EUDR batch ${certificate.batchId} not found`);
    }
    const draft: CertificateDraft = { id: randomUUID(), status: "issued", ...certificate };
    batch.status = "certified";
    batch.certificateId = draft.id;
    workspace.certificates.push(draft);
    workspace.updatedAt = new Date().toISOString();
    return draft;
  }
}
