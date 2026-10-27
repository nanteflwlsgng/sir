import "server-only";
import { query } from "@/shared/db/sql";
import type { ActeurStatus } from "@/modules/auth/domain/account";
import type { ActeurAdminRepository, ActeurListItem, CreateActeurInput, SiteOption } from "../domain/acteur";

interface ActeurRow {
  id: number;
  abbreviation: string;
  name: string;
  type: string;
  status: ActeurStatus;
  rejection_reason: string | null;
  site_label: string;
  region_label: string;
  user_count: number;
  created_at: Date;
  validated_at: Date | null;
}

export const postgresActeurAdminRepository: ActeurAdminRepository = {
  async list(status): Promise<ActeurListItem[]> {
    const { rows } = await query<ActeurRow>(
      `select
         a.id, a.abbreviation, a.name, a.type, a.status, a.rejection_reason,
         a.created_at, a.validated_at,
         s.label as site_label, g.label as region_label,
         (select count(*)::int from users u where u.acteur_id = a.id and u.deleted_at is null) as user_count
       from acteurs a
       join sites s on s.id = a.site_id
       join regions g on g.id = a.region_id
       where ($1 = 'tous' or a.status = $1)
       order by (a.status = 'soumis') desc, a.name asc
       limit 500`,
      [status],
    );

    return rows.map((row) => ({
      id: row.id,
      abbreviation: row.abbreviation,
      name: row.name,
      type: row.type,
      status: row.status,
      rejectionReason: row.rejection_reason,
      siteLabel: row.site_label,
      regionLabel: row.region_label,
      userCount: row.user_count,
      createdAt: row.created_at,
      validatedAt: row.validated_at,
    }));
  },

  async listSites(): Promise<SiteOption[]> {
    const { rows } = await query<SiteOption>(
      "select id, code, label, kind from sites order by (kind = 'CENTRAL') desc, label asc",
    );
    return rows;
  },

  async create(input: CreateActeurInput, actorId: string): Promise<{ id: number }> {
    const { rows } = await query<{ id: number }>(
      `insert into acteurs
         (abbreviation, name, type, site_id, region_id, status, submitted_by, validated_by, validated_at)
       select $1, $2, $3, s.id, s.region_id, 'valide', $4, $4, now()
       from sites s
       where s.id = $5
       returning id`,
      [input.abbreviation, input.name, input.type, actorId, input.siteId],
    );
    const row = rows[0];
    if (!row) {
      throw new Error("Site introuvable lors de la création de l'acteur.");
    }
    return { id: row.id };
  },

  async findStatus(id: number): Promise<ActeurStatus | null> {
    const { rows } = await query<{ status: ActeurStatus }>(
      "select status from acteurs where id = $1",
      [id],
    );
    return rows[0]?.status ?? null;
  },

  async setStatus(
    id: number,
    status: ActeurStatus,
    validatedBy: string,
    rejectionReason: string | null,
  ): Promise<void> {
    await query(
      `update acteurs
       set status = $2, validated_by = $3, validated_at = now(), rejection_reason = $4
       where id = $1`,
      [id, status, validatedBy, rejectionReason],
    );
  },

  async findConflict(abbreviation: string, name: string): Promise<"abbreviation" | "name" | null> {
    const { rows } = await query<{ abbreviation_taken: boolean; name_taken: boolean }>(
      `select
         exists (select 1 from acteurs where lower(abbreviation) = lower($1)) as abbreviation_taken,
         exists (select 1 from acteurs where lower(name) = lower($2)) as name_taken`,
      [abbreviation, name],
    );
    const row = rows[0];
    if (row?.abbreviation_taken) return "abbreviation";
    if (row?.name_taken) return "name";
    return null;
  },
};
