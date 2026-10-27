import { z } from "zod";

export const campaignSchema = z.object({
  id: z.number(),
  label: z.string().min(2).max(100),
  startsOn: z.string().transform((v) => new Date(v)),
  endsOn: z.string().transform((v) => new Date(v)),
  status: z.enum(["preparee", "active", "cloturee"]),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Campaign = z.infer<typeof campaignSchema>;

export const newCampaignSchema = campaignSchema.pick({
  label: true,
  startsOn: true,
  endsOn: true,
});

export type NewCampaign = z.infer<typeof newCampaignSchema>;

export type CampaignFilters = {
  status?: "preparee" | "active" | "cloturee";
  search?: string;
  page?: number;
  limit?: number;
};

export type CampaignListItem = Pick<Campaign, "id" | "label" | "startsOn" | "endsOn" | "status">;