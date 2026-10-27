import "server-only";
import { query } from "@/shared/db/sql";
import {
  withoutSecret,
  type AccountWithSecret,
  type ActeurStatus,
  type AuthenticatedUser,
  type RoleCode,
  type UserStatus,
} from "../domain/account";
import type { AccountRepository, CreateAccountInput } from "../domain/ports";

interface AccountRow {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  status: UserStatus;
  must_change_password: boolean;
  last_login_at: Date | null;
  role_id: number;
  role_code: RoleCode;
  role_label: string;
  role_rank: number;
  acteur_id: number | null;
  acteur_abbreviation: string | null;
  acteur_name: string | null;
  acteur_type: string | null;
  acteur_status: ActeurStatus | null;
  site_id: number | null;
  site_code: string | null;
  site_label: string | null;
  site_kind: "CENTRAL" | "DIREDD" | "DREDD" | "CIREDD" | null;
  region_id: number | null;
  region_code: string | null;
  region_label: string | null;
}

const ACCOUNT_SELECT = `
  select
    u.id, u.username, u.email, u.password_hash, u.first_name, u.last_name, u.status,
    u.must_change_password, u.last_login_at,
    r.id as role_id, r.code as role_code, r.label as role_label, r.rank as role_rank,
    a.id as acteur_id, a.abbreviation as acteur_abbreviation, a.name as acteur_name,
    a.type as acteur_type, a.status as acteur_status,
    s.id as site_id, s.code as site_code, s.label as site_label, s.kind as site_kind,
    g.id as region_id, g.code as region_code, g.label as region_label
  from users u
  join roles r on r.id = u.role_id
  left join acteurs a on a.id = u.acteur_id
  left join sites s on s.id = a.site_id
  left join regions g on g.id = a.region_id
`;

function mapRow(row: AccountRow): AccountWithSecret {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    passwordHash: row.password_hash,
    status: row.status,
    mustChangePassword: row.must_change_password,
    lastLoginAt: row.last_login_at,
    role: {
      id: row.role_id,
      code: row.role_code,
      label: row.role_label,
      rank: row.role_rank,
    },
    acteur:
      row.acteur_id === null
        ? null
        : {
            id: row.acteur_id,
            abbreviation: row.acteur_abbreviation ?? "",
            name: row.acteur_name ?? "",
            type: row.acteur_type ?? "",
            status: row.acteur_status ?? "soumis",
          },
    site:
      row.site_id === null
        ? null
        : {
            id: row.site_id,
            code: row.site_code ?? "",
            label: row.site_label ?? "",
            kind: row.site_kind ?? "DREDD",
          },
    region:
      row.region_id === null
        ? null
        : {
            id: row.region_id,
            code: row.region_code ?? "",
            label: row.region_label ?? "",
          },
  };
}

async function findAccountById(id: string): Promise<AccountWithSecret | null> {
  const { rows } = await query<AccountRow>(
    `${ACCOUNT_SELECT} where u.id = $1 and u.deleted_at is null limit 1`,
    [id],
  );
  const row = rows[0];
  return row ? mapRow(row) : null;
}

export const postgresAccountRepository: AccountRepository = {
  async findByIdentifier(identifier: string): Promise<AccountWithSecret | null> {
    const { rows } = await query<AccountRow>(
      `${ACCOUNT_SELECT}
       where u.deleted_at is null
         and (lower(u.username) = lower($1) or lower(u.email) = lower($1))
       limit 1`,
      [identifier.trim()],
    );
    const row = rows[0];
    return row ? mapRow(row) : null;
  },

  async findAccountById(id: string): Promise<AccountWithSecret | null> {
    return findAccountById(id);
  },

  async findById(id: string): Promise<AuthenticatedUser | null> {
    const account = await findAccountById(id);
    return account ? withoutSecret(account) : null;
  },

  async create(input: CreateAccountInput): Promise<{ id: string }> {
    const { rows } = await query<{ id: string }>(
      `insert into users
         (username, email, password_hash, first_name, last_name, role_id, acteur_id, status, confirmed_at)
       values (
         $1, $2, $3, $4, $5,
         (select id from roles where code = $6),
         $7, $8,
         case when $8 = 'actif' then now() else null end
       )
       returning id`,
      [
        input.username,
        input.email,
        input.passwordHash,
        input.firstName,
        input.lastName,
        input.roleCode,
        input.acteurId,
        input.status,
      ],
    );
    const row = rows[0];
    if (!row) {
      throw new Error("Création de compte : aucune ligne retournée.");
    }
    return { id: row.id };
  },

  async recordLogin(id: string, at: Date): Promise<void> {
    await query("update users set last_login_at = $2 where id = $1", [id, at]);
  },

  async changePassword(id: string, passwordHash: string, mustChangePassword: boolean): Promise<void> {
    await query(
      `update users
       set password_hash = $2, must_change_password = $3
       where id = $1 and deleted_at is null`,
      [id, passwordHash, mustChangePassword],
    );
  },

  async usernameExists(username: string): Promise<boolean> {
    const { rowCount } = await query(
      "select 1 from users where lower(username) = lower($1) and deleted_at is null",
      [username],
    );
    return (rowCount ?? 0) > 0;
  },

  async emailExists(email: string): Promise<boolean> {
    const { rowCount } = await query(
      "select 1 from users where lower(email) = lower($1) and deleted_at is null",
      [email],
    );
    return (rowCount ?? 0) > 0;
  },
};
