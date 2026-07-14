import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";

type VotoIDBoardDraft = {
  workspaceId: string;
  enterpriseId: number;
  rootAddress: string;
  board: {
    chairperson: string;
    secretary: string;
    quorumPercentage: number;
    members: string[];
  };
  sessions: VotoIDSessionDraft[];
  serviceConfigUri?: string;
  createdAt: string;
  updatedAt: string;
};

type VotoIDSessionDraft = {
  id: string;
  name: string;
  deliberationDurationSeconds: number;
  votingDurationSeconds: number;
  status: "open" | "closed";
  membersJoined: string[];
  proposals: VotoIDProposalDraft[];
  createdAt: string;
};

type VotoIDProposalDraft = {
  id: string;
  title: string;
  description: string;
  evidenceManifestUri: string;
  evidenceManifestDigest: string;
  status: "created" | "deliberation" | "voting" | "approved" | "rejected" | "executed" | "verified";
  createdAt: string;
};

type CreateWorkspaceInput = {
  enterpriseId: number;
  rootAddress: string;
  chairperson: string;
  secretary: string;
  quorumPercentage: number;
  serviceConfigUri?: string;
};

type CreateSessionInput = {
  name: string;
  deliberationDurationSeconds: number;
  votingDurationSeconds: number;
  membersJoined?: string[];
};

type CreateProposalInput = {
  title: string;
  description: string;
  evidenceManifestUri: string;
  evidenceManifestDigest: string;
};

@Injectable()
export class VotoIDService {
  private readonly workspaces = new Map<string, VotoIDBoardDraft>();

  createWorkspace(input: CreateWorkspaceInput): VotoIDBoardDraft {
    const now = new Date().toISOString();
    const workspace: VotoIDBoardDraft = {
      workspaceId: randomUUID(),
      enterpriseId: input.enterpriseId,
      rootAddress: input.rootAddress,
      board: {
        chairperson: input.chairperson,
        secretary: input.secretary,
        quorumPercentage: input.quorumPercentage,
        members: [input.chairperson, input.secretary],
      },
      sessions: [],
      serviceConfigUri: input.serviceConfigUri,
      createdAt: now,
      updatedAt: now,
    };

    this.workspaces.set(workspace.workspaceId, workspace);
    return workspace;
  }

  getWorkspace(workspaceId: string): VotoIDBoardDraft {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      throw new NotFoundException(`VotoID workspace ${workspaceId} not found`);
    }
    return workspace;
  }

  addBoardMember(workspaceId: string, member: string): VotoIDBoardDraft {
    const workspace = this.getWorkspace(workspaceId);
    if (!workspace.board.members.includes(member)) {
      workspace.board.members.push(member);
      workspace.updatedAt = new Date().toISOString();
    }
    return workspace;
  }

  createSession(workspaceId: string, input: CreateSessionInput): VotoIDSessionDraft {
    const workspace = this.getWorkspace(workspaceId);
    const session: VotoIDSessionDraft = {
      id: randomUUID(),
      name: input.name,
      deliberationDurationSeconds: input.deliberationDurationSeconds,
      votingDurationSeconds: input.votingDurationSeconds,
      status: "open",
      membersJoined: input.membersJoined ?? [],
      proposals: [],
      createdAt: new Date().toISOString(),
    };

    workspace.sessions.push(session);
    workspace.updatedAt = new Date().toISOString();
    return session;
  }

  createProposal(workspaceId: string, sessionId: string, input: CreateProposalInput): VotoIDProposalDraft {
    const workspace = this.getWorkspace(workspaceId);
    const session = workspace.sessions.find((item) => item.id === sessionId);
    if (!session) {
      throw new NotFoundException(`VotoID session ${sessionId} not found`);
    }

    const proposal: VotoIDProposalDraft = {
      id: randomUUID(),
      title: input.title,
      description: input.description,
      evidenceManifestUri: input.evidenceManifestUri,
      evidenceManifestDigest: input.evidenceManifestDigest,
      status: "created",
      createdAt: new Date().toISOString(),
    };

    session.proposals.push(proposal);
    workspace.updatedAt = new Date().toISOString();
    return proposal;
  }
}
