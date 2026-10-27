/** Entités et types du domaine « compte / identité ». */

export type RoleCode = "membre" | "admin_suppleant" | "admin";

export type UserStatus = "en_attente" | "actif" | "suspendu" | "supprime";

export type ActeurStatus = "soumis" | "valide" | "rejete";

export interface Role {
  id: number;
  code: RoleCode;
  label: string;
  rank: number;
}

export interface ActeurSummary {
  id: number;
  abbreviation: string;
  name: string;
  type: string;
  status: ActeurStatus;
}

export interface SiteSummary {
  id: number;
  code: string;
  label: string;
  kind: "CENTRAL" | "DIREDD" | "DREDD" | "CIREDD";
}

export interface RegionSummary {
  id: number;
  code: string;
  label: string;
}

/** Utilisateur authentifié, tel qu'exposé à l'application (jamais de hash). */
export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  acteur: ActeurSummary | null;
  site: SiteSummary | null;
  region: RegionSummary | null;
  status: UserStatus;
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
}

/** Utilisateur + secret, usage interne à l'authentification. */
export interface AccountWithSecret extends AuthenticatedUser {
  passwordHash: string;
}

/** Retire le secret avant toute exposition hors du module auth. */
export function withoutSecret(account: AccountWithSecret): AuthenticatedUser {
  const { passwordHash: _passwordHash, ...user } = account;
  return user;
}

export function displayName(user: Pick<AuthenticatedUser, "firstName" | "lastName" | "username">): string {
  const full = `${user.firstName} ${user.lastName}`.trim();
  return full.length > 0 ? full : user.username;
}

export function isAdmin(user: Pick<AuthenticatedUser, "role">): boolean {  return user.role.code === "admin";
}

export function canManageReferentials(user: Pick<AuthenticatedUser, "role">): boolean {
  return user.role.rank >= 50;
}

export function userScopeLabel(user: AuthenticatedUser): string {
  const parts = [user.site?.label, user.acteur?.abbreviation, user.region?.label].filter(
    (value): value is string => Boolean(value),
  );
  return parts.length > 0 ? parts.join(" · ") : "Périmètre non défini";
}
