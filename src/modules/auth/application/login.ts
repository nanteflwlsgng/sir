import { env } from "@/shared/config/env";
import { withoutSecret, type AuthenticatedUser } from "../domain/account";
import { generateSessionToken, hashSessionToken } from "../domain/session-token";
import type {
  AccountRepository,
  AuditLogger,
  LoginAttemptStore,
  PasswordHasher,
  SessionRepository,
} from "../domain/ports";

export type LoginFailure =
  | "invalid_credentials"
  | "account_pending"
  | "account_suspended"
  | "too_many_attempts";

export type LoginResult =
  | { ok: true; token: string; expiresAt: Date; user: AuthenticatedUser }
  | { ok: false; code: LoginFailure };

export interface LoginInput {
  identifier: string;
  password: string;
  ip?: string | null;
  userAgent?: string | null;
}

export interface LoginDeps {
  accounts: AccountRepository;
  sessions: SessionRepository;
  hasher: PasswordHasher;
  attempts: LoginAttemptStore;
  audit: AuditLogger;
}

const MAX_FAILURES = 5;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;

/** Hash factice : égalise le temps de réponse quand le compte n'existe pas. */
const DUMMY_HASH =
  "scrypt$16384$8$1$FJ38RbqCtldVjUqR0DKmOg$o8ezWjFMZXncgt6oGZZdU8L8Kr5fDH188Fwy29qvC6aF2IUO7bCE6R20aer7xMnXOcygfYTIgAbRzDtvD44RIQ";

export function createLogin(deps: LoginDeps) {
  return async function login(input: LoginInput): Promise<LoginResult> {
    const identifier = input.identifier.trim();
    const now = new Date();

    const failures = await deps.attempts.countRecentFailures(
      identifier,
      new Date(now.getTime() - FAILURE_WINDOW_MS),
    );
    if (failures >= MAX_FAILURES) {
      return { ok: false, code: "too_many_attempts" };
    }

    const account = await deps.accounts.findByIdentifier(identifier);

    if (!account) {
      await deps.hasher.verify(input.password, DUMMY_HASH);
      await deps.attempts.record({ identifier, ip: input.ip ?? null, success: false });
      return { ok: false, code: "invalid_credentials" };
    }

    const passwordOk = await deps.hasher.verify(input.password, account.passwordHash);
    if (!passwordOk) {
      await deps.attempts.record({ identifier, ip: input.ip ?? null, success: false });
      await deps.audit.log({
        actorUserId: null,
        action: "auth.login.failed",
        entity: "user",
        entityId: account.id,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      });
      return { ok: false, code: "invalid_credentials" };
    }

    if (account.status === "en_attente") {
      return { ok: false, code: "account_pending" };
    }
    if (account.status !== "actif") {
      return { ok: false, code: "account_suspended" };
    }

    const token = generateSessionToken();
    const expiresAt = new Date(now.getTime() + env.SESSION_TTL_HOURS * 60 * 60 * 1000);

    await deps.sessions.create({
      userId: account.id,
      tokenHash: hashSessionToken(token),
      expiresAt,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    });
    await deps.accounts.recordLogin(account.id, now);
    await deps.attempts.clearFailures(identifier);
    await deps.sessions.deleteExpired(now);
    await deps.audit.log({
      actorUserId: account.id,
      action: "auth.login",
      entity: "user",
      entityId: account.id,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    });

    return { ok: true, token, expiresAt, user: withoutSecret(account) };
  };
}
