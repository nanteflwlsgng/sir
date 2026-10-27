import type { PoolClient } from "pg";
import { sql } from "@/shared/db/sql";
import type { CampaignRepository } from "../domain/ports";
import type { Campaign, CampaignListItem, CampaignFilters } from "../domain/campaign";
import type { AuthenticatedUser } from "@/modules/auth/domain/account";
import { env } from "@/shared/config/env";

export function createCampaignPostgresRepository() {
  return {
    async findById(id: number): Promise<Campaign | null> {
      const result = await sql<
        {
          id: number;
          label: string;
          starts_on: string;
          ends_on: string;
          status: "preparee" | "active" | "cloturee";
          created_by: string;
          created_at: string;
          updated_at: string;
        }[]
      >(
        `select id, label, starts_on, ends_on, status, created_by, created_at, updated_at
         from campaigns where id = $1`,
        [id]
      );

      if (result.length === 0) {
        return null;
      }

      const row = result[0];
      return {
        id: row.id,
        label: row.label,
        startsOn: new Date(row.starts_on),
        endsOn: new Date(row.ends_on),
        status: row.status,
        createdBy: row.created_by,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
    },

    async list(filters: CampaignFilters): Promise<CampaignListItem[]> {
      const page = filters.page ?? 1;
      const limit = filters.limit ?? 50;
      const offset = (page - 1) * limit;

      let whereClause = "where 1=1";
      const params: (string | number)[] = [];

      if (filters.status) {
        whereClause += ` and status = $${++params.length}`;
        params.push(filters.status);
      }

      if (filters.search) {
        whereClause += ` and label ilike $${++params.length}`;
        params.push(`%${filters.search}%`);
      }

      const result = await sql<
        {
          id: number;
          label: string;
          starts_on: string;
          ends_on: string;
          status: "preparee" | "active" | "cloturee";
        }[]
      >(
        `select id, label, starts_on, ends_on, status
         from campaigns
         ${whereClause}
         order by starts_on desc
         limit $${++params.length} offset $${++params.length}`,
        ...params,
        limit,
        offset
      );

      return result.map((row) => ({
        id: row.id,
        label: row.label,
        startsOn: new Date(row.starts_on),
        endsOn: new Date(row.ends_on),
        status: row.status,
      }));
    },

    async create(campaign: Omit<Campaign, "id" | "createdAt" | "updatedAt">, actor: AuthenticatedUser): Promise<Campaign> {
      const result = await sql<
        {
          id: number;
          label: string;
          starts_on: string;
          ends_on: string;
          status: "preparee" | "active" | "cloturee";
          created_by: string;
          created_at: string;
          updated_at: string;
        }[]
      >(
        `insert into campaigns (label, starts_on, ends_on, status, created_by)
         values ($1, $2, $3, $4, $5)
         returning *`,
        [
          campaign.label,
          campaign.startsOn.toISOString(),
          campaign.endsOn.toISOString(),
          campaign.status,
          actor.id,
        ]
      );

      const row = result[0];
      return {
        id: row.id,
        label: row.label,
        startsOn: new Date(row.starts_on),
        endsOn: new Date(row.ends_on),
        status: row.status,
        createdBy: row.created_by,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
    },

    async update(id: number, updates: Partial<Campaign>, actor: AuthenticatedUser): Promise<Campaign> {
      const setClauses: string[] = [];
      const params: (string | number | Date)[] = [];
      let paramIndex = 0;

      if (updates.label !== undefined) {
        setClauses.push(`label = $${++paramIndex}`);
        params.push(updates.label);
      }

      if (updates.startsOn !== undefined) {
        setClauses.push(`starts_on = $${++paramIndex}`);
        params.push(updates.startsOn.toISOString());
      }

      if (updates.endsOn !== undefined) {
        setClauses.push(`ends_on = $${++paramIndex}`);
        params.push(updates.endsOn.toISOString());
      }

      if (updates.status !== undefined) {
        setClauses.push(`status = $${++paramIndex}`);
        params.push(updates.status);
      }

      const result = await sql<
        {
          id: number;
          label: string;
          starts_on: string;
          ends_on: string;
          status: "preparee" | "active" | "cloturee";
          created_by: string;
          created_at: string;
          updated_at: string;
        }[]
      >(
        `update campaigns
         set ${setClauses.join(", ")}, updated_at = now()
         where id = $${++paramIndex}
         returning *`,
        [...params, id]
      );

      if (result.length === 0) {
        throw new Error("Campagne non trouvée");
      }

      const row = result[0];
      return {
        id: row.id,
        label: row.label,
        startsOn: new Date(row.starts_on),
        endsOn: new Date(row.ends_on),
        status: row.status,
        createdBy: row.created_by,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
    },

    async delete(id: number, actor: AuthenticatedUser): Promise<void> {
      await sql(`delete from campaigns where id = $1`, [id]);
    },

    async setStatus(id: number, status: "preparee" | "active" | "cloturee", actor: AuthenticatedUser): Promise<Campaign> {
      const result = await sql<
        {
          id: number;
          label: string;
          starts_on: string;
          ends_on: string;
          status: "preparee" | "active" | "cloturee";
          created_by: string;
          created_at: string;
          updated_at: string;
        }[]
      >(
        `update campaigns
         set status = $1, updated_at = now()
         where id = $2
         returning *`,
        [status, id]
      );

      if (result.length === 0) {
        throw new Error("Campagne non trouvée");
      }

      const row = result[0];
      return {
        id: row.id,
        label: row.label,
        startsOn: new Date(row.starts_on),
        endsOn: new Date(row.ends_on),
        status: row.status,
        createdBy: row.created_by,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
    },
  };
}