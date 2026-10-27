import type { AuthenticatedUser } from "../domain/account";
import { hashSessionToken } from "../domain/session-token";
import type { AccountRepository, SessionRepository } from "../domain/ports";

export interface ResolveSessionDeps {
  accounts: AccountRepository;
  sessions: SessionRepository;
}

/** Valide un jeton de session ; retourne null si absent, expiré, révoqué ou compte inactif. */
export function createResolveSession(deps: ResolveSessionDeps) {
  return async function resolveSession(token: string): Promise<AuthenticatedUser | null> {
    const session = await deps.sessions.findByTokenHash(hashSessionToken(token));
    if (!session || session.revokedAt !== null) {
      return null;
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      return null;
    }

    const user = await deps.accounts.findById(session.userId);
    if (!user || user.status !== "actif") {
      return null;
    }

    return user;
  };
}
