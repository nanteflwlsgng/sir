import "server-only";
import { query } from "@/shared/db/sql";
import type { AuditLogger } from "../domain/ports";

/**
 * Journal d'audit : une défaillance du journal ne doit jamais faire échouer
 * l'opération métier, mais elle doit rester visible dans les logs serveur.
 */
export const postgresAuditLogger: AuditLogger = {
  async log(entry): Promise<void> {
    try {
      await query(
        `insert into audit_logs
           (actor_user_id, action, entity, entity_id, before, after, ip, user_agent)
         values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          entry.actorUserId,
          entry.action,
          entry.entity,
          entry.entityId ?? null,
          entry.before ? JSON.stringify(entry.before) : null,
          entry.after ? JSON.stringify(entry.after) : null,
          entry.ip ?? null,
          entry.userAgent ?? null,
        ],
      );
    } catch (error) {
      console.error("[audit] échec d'écriture", error);
    }
  },
};
