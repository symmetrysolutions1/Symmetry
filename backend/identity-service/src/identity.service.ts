import { Injectable } from "@nestjs/common";

@Injectable()
export class IdentityProjectionService {
  summarizeEnterpriseIdentity(enterpriseId: bigint) {
    return {
      enterpriseId: enterpriseId.toString(),
      projection: "pending-indexer-integration",
    };
  }
}
