import type { RoleCode, UserStatus } from "@/modules/auth/domain/account";

/** Read model « utilisateur » pour le back-office. */
export interface UserListItem {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  roleCode: RoleCode;
  roleLabel: string;
  acteurAbbreviation: string;
  acteurName: string;
  siteLabel: string;
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface UserFilters {
  search?: string;
  status?: UserStatus | "tous";
}

export interface UserAdminRepository {
  list(filters: UserFilters): Promise<UserListItem[]>;
  findById(id: string): Promise<UserListItem | null>;
  findStatus(id: string): Promise<UserStatus | null>;
  updateStatus(id: string, status: UserStatus, confirmedAt: Date | null): Promise<void>;
  setPassword(id: string, passwordHash: string, mustChangePassword: boolean): Promise<void>;
}
