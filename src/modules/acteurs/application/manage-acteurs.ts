import { z } from "zod";
import type { AuthenticatedUser } from "@/modules/auth/domain/account";
import type { AuditLogger } from "@/modules/auth/domain/ports";
import { ACTEUR_TYPES, type ActeurAdminRepository, type ActeurListItem, type SiteOption } from "../domain/acteur";

export const acteurSchema = z.object({
  abbreviation: z
    .string()
    .trim()
    .min(2, "L'abréviation doit contenir au moins 2 caractères.")
    .max(20, "L'abréviation ne peut pas dépasser 20 caractères.")
    .regex(/^[A-Za-z0-9 ._'-]+$/, "Caractères autorisés : lettres, chiffres, espaces, . _ ' -"),
  name: z
    .string()
    .trim()
    .min(3, "Le nom complet doit contenir au moins 3 caractères.")
    .max(160, "Le nom complet ne peut pas dépasser 160 caractères."),
  type: z.enum(ACTEUR_TYPES, { error: "Sélectionnez un type d'acteur." }),
  siteId: z.coerce.number().int().positive("Sélectionnez un site de rattachement."),
});

export type ActeurField = "abbreviation" | "name" | "type" | "siteId" | "form";

export type CreateActeurResult =
  | { ok: true; id: number }
  | { ok: false; fieldErrors: Partial<Record<ActeurField, string>> };

export type ActeurActionResult =
  | { ok: true }
  | { ok: false; error: "forbidden" | "not_found" | "invalid_transition" };

export interface ActeurAdministrationDeps {
  acteurs: ActeurAdminRepository;
  audit: AuditLogger;
}

function assertManager(actor: AuthenticatedUser): ActeurActionResult | null {
  return actor.role.rank >= 50 ? null : { ok: false, error: "forbidden" };
}

export function createActeurAdministration(deps: ActeurAdministrationDeps) {
  return {
    async list(actor: AuthenticatedUser, status: "tous" | "soumis" | "valide" | "rejete"): Promise<ActeurListItem[]> {
      if (actor.role.rank < 50) throw new Error("Action réservée aux administrateurs.");
      return deps.acteurs.list(status);
    },

    async sites(actor: AuthenticatedUser): Promise<SiteOption[]> {
      if (actor.role.rank < 50) throw new Error("Action réservée aux administrateurs.");
      return deps.acteurs.listSites();
    },

    async create(actor: AuthenticatedUser, rawInput: unknown): Promise<CreateActeurResult> {
      const forbidden = assertManager(actor);
      if (forbidden) return { ok: false, fieldErrors: { form: "Action non autorisée." } };

      const parsed = acteurSchema.safeParse(rawInput);
      if (!parsed.success) {
        const fieldErrors: Partial<Record<ActeurField, string>> = {};
        for (const issue of parsed.error.issues) {
          const key = issue.path[0];
          if (typeof key === "string" && !(key in fieldErrors)) {
            fieldErrors[key as ActeurField] = issue.message;
          }
        }
        return { ok: false, fieldErrors };
      }

      const conflict = await deps.acteurs.findConflict(parsed.data.abbreviation, parsed.data.name);
      if (conflict === "abbreviation") {
        return { ok: false, fieldErrors: { abbreviation: "Cette abréviation est déjà utilisée." } };
      }
      if (conflict === "name") {
        return { ok: false, fieldErrors: { name: "Un organisme porte déjà ce nom." } };
      }

      const created = await deps.acteurs.create(parsed.data, actor.id);
      await deps.audit.log({
        actorUserId: actor.id,
        action: "acteur.created",
        entity: "acteur",
        entityId: String(created.id),
        after: { ...parsed.data },
      });

      return { ok: true, id: created.id };
    },

    async validate(actor: AuthenticatedUser, acteurId: number): Promise<ActeurActionResult> {
      const forbidden = assertManager(actor);
      if (forbidden) return forbidden;

      const status = await deps.acteurs.findStatus(acteurId);
      if (!status) return { ok: false, error: "not_found" };
      if (status !== "soumis" && status !== "rejete") {
        return { ok: false, error: "invalid_transition" };
      }

      await deps.acteurs.setStatus(acteurId, "valide", actor.id, null);
      await deps.audit.log({
        actorUserId: actor.id,
        action: "acteur.validated",
        entity: "acteur",
        entityId: String(acteurId),
        before: { status },
        after: { status: "valide" },
      });
      return { ok: true };
    },

    async reject(
      actor: AuthenticatedUser,
      acteurId: number,
      reason: string,
    ): Promise<ActeurActionResult> {
      const forbidden = assertManager(actor);
      if (forbidden) return forbidden;
      if (reason.trim().length < 3) {
        return { ok: false, error: "invalid_transition" };
      }

      const status = await deps.acteurs.findStatus(acteurId);
      if (!status) return { ok: false, error: "not_found" };
      if (status === "rejete") return { ok: false, error: "invalid_transition" };

      await deps.acteurs.setStatus(acteurId, "rejete", actor.id, reason.trim());
      await deps.audit.log({
        actorUserId: actor.id,
        action: "acteur.rejected",
        entity: "acteur",
        entityId: String(acteurId),
        before: { status },
        after: { status: "rejete", reason: reason.trim() },
      });
      return { ok: true };
    },
  };
}
