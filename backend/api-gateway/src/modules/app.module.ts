import { Module } from "@nestjs/common";
import { HealthController } from "../routes/health.controller";
import { EnterprisesController } from "../routes/enterprises.controller";
import { AutomationController } from "../routes/automation.controller";
import { EudrController } from "../routes/eudr.controller";
import { NatureController } from "../routes/nature.controller";
import { VotoIDController } from "../routes/votoid.controller";
import { AutomationService } from "../services/automation.service";
import { CopernicusStacService } from "../services/copernicus-stac.service";
import { CopernicusStatisticsService } from "../services/copernicus-statistics.service";
import { EudrService } from "../services/eudr.service";
import { NatureService } from "../services/nature.service";
import { OnboardingService } from "../services/onboarding.service";
import { VotoIDService } from "../services/votoid.service";

@Module({
  controllers: [
    HealthController,
    EnterprisesController,
    VotoIDController,
    AutomationController,
    EudrController,
    NatureController,
  ],
  providers: [
    OnboardingService,
    VotoIDService,
    AutomationService,
    EudrService,
    CopernicusStacService,
    CopernicusStatisticsService,
    NatureService,
  ],
})
export class AppModule {}
