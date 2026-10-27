import "server-only";
import { postgresAuditLogger } from "@/modules/auth/infrastructure/postgres-audit.logger";
import { postgresSessionRepository } from "@/modules/auth/infrastructure/postgres-session.repository";
import { scryptPasswordHasher } from "@/modules/auth/infrastructure/scrypt-password-hasher";
import { createUserAdministration } from "../application/manage-users";
import { postgresUserAdminRepository } from "./postgres-user-admin.repository";

/** Composition root du module users (administration). */
export const usersContainer = createUserAdministration({
  users: postgresUserAdminRepository,
  sessions: postgresSessionRepository,
  hasher: scryptPasswordHasher,
  audit: postgresAuditLogger,
});
