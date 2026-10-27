import "server-only";
import { query } from "@/shared/db/sql";
import type { RoleCode, UserStatus } from "@/modules/auth/domain/account";
import type { UserAdminRepository, UserListItem } from "../domain/user";

interface UserRow {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  status: UserStatus;
  role_code: RoleCode;
  role_label: string;
  must_change_password: boolean;
  last_login_at: Date | null;
  created_at: Date;
  acteur_abbreviation: string;
  acteur_name: string;
  site_label: string;
}

function mapUserRow(row: UserRow): UserListItem {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    status: row.status,
    roleCode: row.role_code,
    roleLabel: row.role_label,
    acteurAbbreviation: row.acteur_abbreviation,
    acteurName: row.acteur_name,
    siteLabel: row.site_label,
    mustChangePassword: row.must_change_password,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
  };
}

export const postgresUserAdminRepository: UserAdminRepository = {
  async list(filters): Promise<UserListItem[]> {
    const search = filters.search?.trim() ?? "";
    const status = filters.status ?? "tous";

    const { rows } = await query<UserRow>(
      `select
         u.id, u.username, u.email, u.first_name, u.last_name, u.status,
         u.must_change_password, u.last_login_at, u.created_at,
         r.code as role_code, r.label as role_label,
         a.abbreviation as acteur_abbreviation, a.name as acteur_name,
         s.label as site_label
       from users u
       join roles r on r.id = u.role_id
       join acteurs a on a.id = u.acteur_id
       join sites s on s.id = a.site_id
       where u.deleted_at is null
         and ($1 = '' or u.username ilike '%' || $1 || '%'
              or u.email ilike '%' || $1 || '%'
              or u.first_name ilike '%' || $1 || '%'
              or u.last_name ilike '%' || $1 || '%'
              or a.name ilike '%' || $1 || '%')
         and ($2 = 'tous' or u.status = $2)
       order by (u.status = 'en_attente') desc, u.created_at desc
       limit 200`,
      [search, status],
    );

    return rows.map(mapUserRow);
  },

  async findById(id: string): Promise<UserListItem | null> {
    const { rows } = await query<UserRow>(
      `select
         u.id, u.username, u.email, u.first_name, u.last_name, u.status,
         u.must_change_password, u.last_login_at, u.created_at,
         r.code as role_code, r.label as role_label,
         a.abbreviation as acteur_abbreviation, a.name as acteur_name,
         s.label as site_label
       from users u
       join roles r on r.id = u.role_id
       join acteurs a on a.id = u.acteur_id
       join sites s on s.id = a.site_id
       where u.id = $1 and u.deleted_at is null
       limit 1`,
      [id],
    );
    const row = rows[0];
    return row ? mapUserRow(row) : null;
  },

  async findStatus(id: string): Promise<UserStatus | null> {
    const { rows } = await query<{ status: UserStatus }>(
      "select status from users where id = $1 and deleted_at is null",
      [id],
    );
    return rows[0]?.status ?? null;
  },

  async updateStatus(id: string, status: UserStatus, confirmedAt: Date | null): Promise<void> {
    await query(
      `update users
       set status = $2,
           confirmed_at = coalesce($3, confirmed_at)
       where id = $1 and deleted_at is null`,
      [id, status, confirmedAt],
    );
  },

  async setPassword(id: string, passwordHash: string, mustChangePassword: boolean): Promise<void> {
    await query(
      `update users
       set password_hash = $2, must_change_password = $3
       where id = $1 and deleted_at is null`,
      [id, passwordHash, mustChangePassword],
    );
  },
};
