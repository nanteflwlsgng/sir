import "server-only";
import { query } from "@/shared/db/sql";
import type { RegistrationActorDirectory, ValidatedActeurOption } from "../domain/ports";

export const postgresRegistrationActorDirectory: RegistrationActorDirectory = {
  async listValidated(): Promise<ValidatedActeurOption[]> {
    const { rows } = await query<{
      id: number;
      abbreviation: string;
      name: string;
      site_label: string;
      region_label: string;
    }>(
      `select a.id, a.abbreviation, a.name, s.label as site_label, g.label as region_label
       from acteurs a
       join sites s on s.id = a.site_id
       join regions g on g.id = a.region_id
       where a.status = 'valide'
       order by a.name asc`,
    );

    return rows.map((row) => ({
      id: row.id,
      abbreviation: row.abbreviation,
      name: row.name,
      siteLabel: row.site_label,
      regionLabel: row.region_label,
    }));
  },

  async isSelectable(acteurId: number): Promise<boolean> {
    const { rowCount } = await query(
      "select 1 from acteurs where id = $1 and status = 'valide'",
      [acteurId],
    );
    return (rowCount ?? 0) > 0;
  },
};
