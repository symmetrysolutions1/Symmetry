import { Module } from "@nestjs/common";
import { IdentityProjectionService } from "./identity.service";

@Module({
  providers: [IdentityProjectionService],
  exports: [IdentityProjectionService],
})
export class IdentityModule {}
