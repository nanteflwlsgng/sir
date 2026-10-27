import "server-only";
import { createChangeOwnPassword } from "../application/change-own-password";
import { createLogin } from "../application/login";
import { createLogout } from "../application/logout";
import { createRegister } from "../application/register";
import { createResolveSession } from "../application/resolve-session";
import { postgresAccountRepository } from "./postgres-account.repository";
import { postgresAuditLogger } from "./postgres-audit.logger";
import { postgresLoginAttemptStore } from "./postgres-login-attempt.store";
import { postgresRegistrationActorDirectory } from "./postgres-registration-actor.directory";
import { postgresSessionRepository } from "./postgres-session.repository";
import { scryptPasswordHasher } from "./scrypt-password-hasher";

const accounts = postgresAccountRepository;
const sessions = postgresSessionRepository;
const hasher = scryptPasswordHasher;
const attempts = postgresLoginAttemptStore;
const audit = postgresAuditLogger;
const actors = postgresRegistrationActorDirectory;

/** Composition root du module auth. */
export const authContainer = {
  login: createLogin({ accounts, sessions, hasher, attempts, audit }),
  logout: createLogout({ sessions }),
  register: createRegister({ accounts, hasher, actors, audit }),
  resolveSession: createResolveSession({ accounts, sessions }),
  changeOwnPassword: createChangeOwnPassword({ accounts, hasher, sessions, audit }),
  listValidatedActeurs: actors.listValidated,
};
