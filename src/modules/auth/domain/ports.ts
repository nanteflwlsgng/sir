import type { AccountWithSecret, AuthenticatedUser, RoleCode, UserStatus } from "./account";

/** Ports (interfaces) du module auth — implémentés en infrastructure. */

export interface CreateAccountInput {
  username: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  roleCode: RoleCode;
  acteurId: number;
  status: UserStatus;
}

export interface AccountRepository {
  findByIdentifier(identifier: string): Promise<AccountWithSecret | null>;
  findAccountById(id: string): Promise<AccountWithSecret | null>;
  findById(id: string): Promise<AuthenticatedUser | null>;
  create(input: CreateAccountInput): Promise<{ id: string }>;
  recordLogin(id: string, at: Date): Promise<void>;
  changePassword(id: string, passwordHash: string, mustChangePassword: boolean): Promise<void>;
  usernameExists(username: string): Promise<boolean>;
  emailExists(email: string): Promise<boolean>;
}

export interface SessionRecord {
  id: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface SessionRepository {
  create(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    ip: string | null;
    userAgent: string | null;
  }): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<SessionRecord | null>;
  revokeByTokenHash(tokenHash: string, at: Date): Promise<void>;
  revokeAllForUser(userId: string, at: Date): Promise<void>;
  deleteExpired(before: Date): Promise<void>;
}

export interface PasswordHasher {
  hash(plainPassword: string): Promise<string>;
  verify(plainPassword: string, storedHash: string): Promise<boolean>;
}

export interface LoginAttemptStore {
  countRecentFailures(identifier: string, since: Date): Promise<number>;
  record(input: { identifier: string; ip: string | null; success: boolean }): Promise<void>;
  clearFailures(identifier: string): Promise<void>;
}

export interface AuditEntry {
  actorUserId: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
}

export interface AuditLogger {
  log(entry: AuditEntry): Promise<void>;
}

/** Acteur validé proposé à l'inscription. */
export interface ValidatedActeurOption {
  id: number;
  abbreviation: string;
  name: string;
  siteLabel: string;
  regionLabel: string;
}

export interface RegistrationActorDirectory {
  listValidated(): Promise<ValidatedActeurOption[]>;
  isSelectable(acteurId: number): Promise<boolean>;
}
