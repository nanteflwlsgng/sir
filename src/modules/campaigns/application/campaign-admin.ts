import { env } from "@/shared/config/env";
import type { CampaignRepository } from "../domain/ports";
import { type Campaign, type NewCampaign, type CampaignListItem } from "../domain/campaign";
import { type AuthenticatedUser } from "@/modules/auth/domain/account";

export type CampaignActionResult =
  | { ok: true; campaign: Campaign }
  | { ok: false; error: "not_found" | "forbidden" | "invalid_transition" | "conflict" };

export interface CampaignAdminDeps {
  campaigns: CampaignRepository;
  audit: AuditLogger;
}

export interface AuditLogger {
  log(params: {
    actorUserId: string | null;
    action: string;
    entity: "campaign";
    entityId: number;
    before?: Record<string, any>;
    after?: Record<string, any>;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<void>;
}

function assertAdmin(actor: AuthenticatedUser): void {
  if (actor.role.code !== "admin") {
    throw new ForbiddenActionError();
  }
}

export class ForbiddenActionError extends Error {
  constructor() {
    super("Action réservée aux administrateurs.");
    this.name = "ForbiddenActionError";
  }
}

function isTransitionValid(
  currentStatus: "preparee" | "active" | "cloturee",
  newStatus: "preparee" | "active" | "cloturee"
): boolean {
  switch (currentStatus) {
    case "preparee":
      return newStatus === "active"; // Seul preparee peut devenir active
    case "active":
      return newStatus === "cloturee"; // Active peut devenir cloturee
    case "cloturee":
      return newStatus === "preparee"; // cloturee peut redevenir preparee (redémarrer)
    default:
      return false;
  }
}

function checkCampaignDates(startsOn: Date, endsOn: Date): "ok" | "invalid" {
  if (startsOn >= endsOn) {
    return "invalid";
  }
  return "ok";
}

export function createCampaignAdmin(deps: CampaignAdminDeps) {
  return {
    async list(actor: AuthenticatedUser, filters: { status?: "preparee" | "active" | "cloturee"; search?: string; page?: number; limit?: number; }): Promise<CampaignListItem[]> {
      assertAdmin(actor);
      return deps.campaigns.list(filters);
    },

    async get(actor: AuthenticatedUser, id: number): Promise<Campaign | null> {
      assertAdmin(actor);
      return deps.campaigns.findById(id);
    },

    async create(actor: AuthenticatedUser, input: NewCampaign): Promise<CampaignActionResult> {
      assertAdmin(actor);

      // Validation des dates
      if (checkCampaignDates(input.startsOn, input.endsOn) === "invalid") {
        return { ok: false, error: "invalid_transition" };
      }

      // Si la campagne est active, il ne doit y avoir aucune campagne active existante
      if (input.status === "active") {
        const existingActive = await deps.campaigns.list({ status: "active" });
        if (existingActive.length > 0) {
          return { ok: false, error: "conflict" };
        }
      }

      const campaign = await deps.campaigns.create(
        { ...input, createdBy: actor.id },
        actor
      );

      await deps.audit.log({
        actorUserId: actor.id,
        action: "campaign.created",
        entity: "campaign",
        entityId: campaign.id,
        after: { ...campaign },
        ip: undefined,
        userAgent: undefined,
      });

      return { ok: true, campaign };
    },

    async update(actor: AuthenticatedUser, id: number, updates: Partial<Campaign>): Promise<CampaignActionResult> {
      assertAdmin(actor);

      const existing = await deps.campaigns.findById(id);
      if (!existing) {
        return { ok: false, error: "not_found" };
      }

      // Si on veut changer le statut
      if (updates.status && updates.status !== existing.status) {
        if (!isTransitionValid(existing.status, updates.status)) {
          return { ok: false, error: "invalid_transition" };
        }

        // Validation spécifique de transition : si active → cloturee, vérifie les dates
        if (existing.status === "active" && updates.status === "cloturee") {
          const now = new Date();
          if (new Date(existing.endsOn) > now) {
            return { ok: false, error: "invalid_transition" }; // Pas encore terminé
          }
        }

        // Si nouvelle campagne active → aucune autre active
        if (updates.status === "active") {
          const existingActive = await deps.campaigns.list({ status: "active" });
          if (existingActive.length > 0 && existingActive.some(c => c.id !== id)) {
            return { ok: false, error: "conflict" };
          }
        }
      }

      const updated = await deps.campaigns.update(id, updates, actor);

      await deps.audit.log({
        actorUserId: actor.id,
        action: "campaign.updated",
        entity: "campaign",
        entityId: id,
        before: existing,
        after: updated,
        ip: undefined,
        userAgent: undefined,
      });

      return { ok: true, campaign: updated };
    },

    async setStatus(actor: AuthenticatedUser, id: number, status: "preparee" | "active" | "cloturee"): Promise<CampaignActionResult> {
      return this.update(actor, id, { status });
    },

    async delete(actor: AuthenticatedUser, id: number): Promise<{ ok: true } | { ok: false; error: "not_found" | "forbidden" }> {
      assertAdmin(actor);

      const existing = await deps.campaigns.findById(id);
      if (!existing) {
        return { ok: false, error: "not_found" };
      }

      await deps.campaigns.delete(id, actor);

      await deps.audit.log({
        actorUserId: actor.id,
        action: "campaign.deleted",
        entity: "campaign",
        entityId: id,
        before: existing,
        ip: undefined,
        userAgent: undefined,
      });

      return { ok: true };
    },
  };
}