import type { CampaignAdminDeps } from "../application/campaign-admin";
import { createCampaignPostgresRepository } from "./postgres-campaign.repository";
import { createPostgresAuditLogger } from "@/modules/auth/infrastructure/postgres-audit.logger";

export const campaignsContainer: CampaignAdminDeps = {
  campaigns: createCampaignPostgresRepository(),
  audit: createPostgresAuditLogger(),
};