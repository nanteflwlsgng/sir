import type { AuthenticatedUser } from "@/modules/auth/domain/account";
import type { AuditLogger, PasswordHasher, SessionRepository } from "@/modules/auth/domain/ports";
import { passwordSchema } from "@/modules/auth/application/validation";
import type { UserAdminRepository, UserFilters, UserListItem } from "../domain/user";

export type UserActionError =
  | "forbidden"
  | "not_found"
  | "invalid_transition"
  | "self_action"
  | "weak_password";

export type UserActionResult = { ok: true } | { ok: false; error: UserActionError };

export interface UserAdministrationDeps {
  users: UserAdminRepository;
  sessions: SessionRepository;
  hasher: PasswordHasher;
  audit: AuditLogger;
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

export function createUserAdministration(deps: UserAdministrationDeps) {
  return {
    async list(actor: AuthenticatedUser, filters: UserFilters): Promise<UserListItem[]> {
      assertAdmin(actor);
      return deps.users.list(filters);
    },

    async get(actor: AuthenticatedUser, userId: string): Promise<UserListItem | null> {
      assertAdmin(actor);
      return deps.users.findById(userId);
    },

    async confirm(actor: AuthenticatedUser, userId: string): Promise<UserActionResult> {
      assertAdmin(actor);
      const status = await deps.users.findStatus(userId);
      if (!status) return { ok: false, error: "not_found" };
      if (status !== "en_attente") return { ok: false, error: "invalid_transition" };

      await deps.users.updateStatus(userId, "actif", new Date());
      await deps.audit.log({
        actorUserId: actor.id,
        action: "user.confirmed",
        entity: "user",
        entityId: userId,
        before: { status },
        after: { status: "actif" },
      });
      return { ok: true };
    },

    async suspend(actor: AuthenticatedUser, userId: string): Promise<UserActionResult> {
      assertAdmin(actor);
      if (actor.id === userId) return { ok: false, error: "self_action" };

      const status = await deps.users.findStatus(userId);
      if (!status) return { ok: false, error: "not_found" };
      if (status !== "actif") return { ok: false, error: "invalid_transition" };

      await deps.users.updateStatus(userId, "suspendu", null);
      await deps.sessions.revokeAllForUser(userId, new Date());
      await deps.audit.log({
        actorUserId: actor.id,
        action: "user.suspended",
        entity: "user",
        entityId: userId,
        before: { status },
        after: { status: "suspendu" },
      });
      return { ok: true };
    },

    async reactivate(actor: AuthenticatedUser, userId: string): Promise<UserActionResult> {
      assertAdmin(actor);
      const status = await deps.users.findStatus(userId);
      if (!status) return { ok: false, error: "not_found" };
      if (status !== "suspendu" && status !== "en_attente") {
        return { ok: false, error: "invalid_transition" };
      }

      await deps.users.updateStatus(userId, "actif", new Date());
      await deps.audit.log({
        actorUserId: actor.id,
        action: "user.reactivated",
        entity: "user",
        entityId: userId,
        before: { status },
        after: { status: "actif" },
      });
      return { ok: true };
    },

    async resetPassword(
      actor: AuthenticatedUser,
      userId: string,
      newPassword: string,
    ): Promise<UserActionResult> {
      assertAdmin(actor);
      if (!passwordSchema.safeParse(newPassword).success) {
        return { ok: false, error: "weak_password" };
      }
      const status = await deps.users.findStatus(userId);
      if (!status) return { ok: false, error: "not_found" };

      const passwordHash = await deps.hasher.hash(newPassword);
      await deps.users.setPassword(userId, passwordHash, true);
      await deps.sessions.revokeAllForUser(userId, new Date());
      await deps.audit.log({
        actorUserId: actor.id,
        action: "user.password.reset",
        entity: "user",
        entityId: userId,
      });
      return { ok: true };
    },
  };
}
