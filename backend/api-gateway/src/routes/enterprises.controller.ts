import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { OnboardingService } from "../services/onboarding.service";

type CreateEnterpriseBody = {
  legalName: string;
  jurisdictionCode: string;
  adminWallet: string;
  multisigWallet: string;
  enabledServices: string[];
  metadataUri?: string;
};

@Controller("enterprises")
export class EnterprisesController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post()
  createEnterprise(@Body() body: CreateEnterpriseBody) {
    return this.onboardingService.createDraftEnterprise(body);
  }

  @Get(":id")
  getEnterprise(@Param("id") id: string) {
    return this.onboardingService.getDraftEnterprise(id);
  }
}
