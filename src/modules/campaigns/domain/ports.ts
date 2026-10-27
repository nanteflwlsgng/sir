import { type Campaign, type CampaignListItem, type CampaignFilters } from "./campaign";
import { type AuthenticatedUser } from "@/modules/auth/domain/account";

export interface CampaignRepository {
  findById(id: number): Promise<Campaign | null>;
  list(filters: CampaignFilters): Promise<CampaignListItem[]>;
  create(campaign: Omit<Campaign, "id" | "createdAt" | "updatedAt">, actor: AuthenticatedUser): Promise<Campaign>;
  update(id: number, updates: Partial<Campaign>, actor: AuthenticatedUser): Promise<Campaign>;
  delete(id: number, actor: AuthenticatedUser): Promise<void>;
  setStatus(id: number, status: "preparee" | "active" | "cloturee", actor: AuthenticatedUser): Promise<Campaign>;
}

export type { CampaignFilters };