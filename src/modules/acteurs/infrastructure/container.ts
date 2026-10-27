import "server-only";
import { postgresAuditLogger } from "@/modules/auth/infrastructure/postgres-audit.logger";
import { createActeurAdministration } from "../application/manage-acteurs";
import { postgresActeurAdminRepository } from "./postgres-acteur-admin.repository";

/** Composition root du module acteurs. */
export const acteursContainer = createActeurAdministration({
  acteurs: postgresActeurAdminRepository,
  audit: postgresAuditLogger,
});
