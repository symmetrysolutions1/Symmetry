import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { VotoIDService } from "../services/votoid.service";

type CreateWorkspaceBody = {
  enterpriseId: number;
  rootAddress: string;
  chairperson: string;
  secretary: string;
  quorumPercentage: number;
  serviceConfigUri?: string;
};

type AddBoardMemberBody = {
  member: string;
};

type CreateSessionBody = {
  name: string;
  deliberationDurationSeconds: number;
  votingDurationSeconds: number;
  membersJoined?: string[];
};

type CreateProposalBody = {
  title: string;
  description: string;
  evidenceManifestUri: string;
  evidenceManifestDigest: string;
};

@Controller("votoid")
export class VotoIDController {
  constructor(private readonly votoIDService: VotoIDService) {}

  @Post("workspaces")
  createWorkspace(@Body() body: CreateWorkspaceBody) {
    return this.votoIDService.createWorkspace(body);
  }

  @Get("workspaces/:workspaceId")
  getWorkspace(@Param("workspaceId") workspaceId: string) {
    return this.votoIDService.getWorkspace(workspaceId);
  }

  @Post("workspaces/:workspaceId/members")
  addBoardMember(@Param("workspaceId") workspaceId: string, @Body() body: AddBoardMemberBody) {
    return this.votoIDService.addBoardMember(workspaceId, body.member);
  }

  @Post("workspaces/:workspaceId/sessions")
  createSession(@Param("workspaceId") workspaceId: string, @Body() body: CreateSessionBody) {
    return this.votoIDService.createSession(workspaceId, body);
  }

  @Post("workspaces/:workspaceId/sessions/:sessionId/proposals")
  createProposal(
    @Param("workspaceId") workspaceId: string,
    @Param("sessionId") sessionId: string,
    @Body() body: CreateProposalBody,
  ) {
    return this.votoIDService.createProposal(workspaceId, sessionId, body);
  }
}
