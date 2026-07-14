import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";

type DraftEnterprise = {
  id: string;
  legalName: string;
  jurisdictionCode: string;
  adminWallet: string;
  multisigWallet: string;
  enabledServices: string[];
  metadataUri?: string;
  status: "drafted";
  createdAt: string;
};

@Injectable()
export class OnboardingService {
  private readonly drafts = new Map<string, DraftEnterprise>();

  createDraftEnterprise(input: Omit<DraftEnterprise, "id" | "status" | "createdAt">): DraftEnterprise {
    const draft: DraftEnterprise = {
      id: randomUUID(),
      status: "drafted",
      createdAt: new Date().toISOString(),
      ...input,
    };
    this.drafts.set(draft.id, draft);
    return draft;
  }

  getDraftEnterprise(id: string): DraftEnterprise {
    const draft = this.drafts.get(id);
    if (!draft) {
      throw new NotFoundException(`Enterprise draft ${id} not found`);
    }
    return draft;
  }
}
