import { changePasswordSchema } from "./validation";
import type { AccountRepository, AuditLogger, PasswordHasher, SessionRepository } from "../domain/ports";

export type ChangeOwnPasswordResult =
  | { ok: true }
  | { ok: false; error: "validation" | "invalid_current_password" | "same_password" };

export interface ChangeOwnPasswordDeps {
  accounts: AccountRepository;
  hasher: PasswordHasher;
  sessions: SessionRepository;
  audit: AuditLogger;
}

export function createChangeOwnPassword(deps: ChangeOwnPasswordDeps) {
  return async function changeOwnPassword(
    userId: string,
    rawInput: unknown,
  ): Promise<ChangeOwnPasswordResult> {
    const parsed = changePasswordSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { ok: false, error: "validation" };
    }

    const { currentPassword, newPassword, confirmPassword } = parsed.data;
    if (newPassword !== confirmPassword) {
      return { ok: false, error: "validation" };
    }

    const account = await deps.accounts.findAccountById(userId);
    if (!account) {
      return { ok: false, error: "invalid_current_password" };
    }

    const currentOk = await deps.hasher.verify(currentPassword, account.passwordHash);
    if (!currentOk) {
      return { ok: false, error: "invalid_current_password" };
    }

    if (currentPassword === newPassword) {
      return { ok: false, error: "same_password" };
    }

    const passwordHash = await deps.hasher.hash(newPassword);
    await deps.accounts.changePassword(userId, passwordHash, false);
    await deps.audit.log({
      actorUserId: userId,
      action: "auth.password.changed",
      entity: "user",
      entityId: userId,
    });

    return { ok: true };
  };
}
