import { registerSchema } from "./validation";
import type {
  AccountRepository,
  AuditLogger,
  PasswordHasher,
  RegistrationActorDirectory,
} from "../domain/ports";

export type RegisterField =
  | "firstName"
  | "lastName"
  | "username"
  | "email"
  | "password"
  | "acteurId"
  | "form";

export type RegisterResult =
  | { ok: true; userId: string }
  | { ok: false; fieldErrors: Partial<Record<RegisterField, string>> };

export interface RegisterDeps {
  accounts: AccountRepository;
  hasher: PasswordHasher;
  actors: RegistrationActorDirectory;
  audit: AuditLogger;
}

/**
 * Inscription publique : le rôle est TOUJOURS « membre » et le compte reste
 * « en_attente » jusqu'à validation par un administrateur.
 */
export function createRegister(deps: RegisterDeps) {
  return async function register(rawInput: unknown, context: { ip?: string | null; userAgent?: string | null }): Promise<RegisterResult> {
    const parsed = registerSchema.safeParse(rawInput);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<RegisterField, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !(key in fieldErrors)) {
          fieldErrors[key as RegisterField] = issue.message;
        }
      }
      return { ok: false, fieldErrors };
    }

    const input = parsed.data;
    const fieldErrors: Partial<Record<RegisterField, string>> = {};

    const [acteurSelectable, usernameTaken, emailTaken] = await Promise.all([
      deps.actors.isSelectable(input.acteurId),
      deps.accounts.usernameExists(input.username),
      deps.accounts.emailExists(input.email),
    ]);

    if (!acteurSelectable) {
      fieldErrors.acteurId = "Cet organisme n'est pas disponible à l'inscription.";
    }
    if (usernameTaken) {
      fieldErrors.username = "Cet identifiant est déjà utilisé.";
    }
    if (emailTaken) {
      fieldErrors.email = "Cette adresse e-mail est déjà utilisée.";
    }
    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, fieldErrors };
    }

    const passwordHash = await deps.hasher.hash(input.password);

    const created = await deps.accounts.create({
      username: input.username,
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      roleCode: "membre",
      acteurId: input.acteurId,
      status: "en_attente",
    });

    await deps.audit.log({
      actorUserId: created.id,
      action: "auth.register",
      entity: "user",
      entityId: created.id,
      after: { username: input.username, email: input.email, acteurId: input.acteurId },
      ip: context.ip ?? null,
      userAgent: context.userAgent ?? null,
    });

    return { ok: true, userId: created.id };
  };
}
