import { hashSessionToken } from "../domain/session-token";
import type { SessionRepository } from "../domain/ports";

export interface LogoutDeps {
  sessions: SessionRepository;
}

export function createLogout(deps: LogoutDeps) {
  return async function logout(token: string): Promise<void> {
    await deps.sessions.revokeByTokenHash(hashSessionToken(token), new Date());
  };
}
