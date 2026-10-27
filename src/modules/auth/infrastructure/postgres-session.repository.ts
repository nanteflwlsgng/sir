import "server-only";
import { query } from "@/shared/db/sql";
import type { SessionRecord, SessionRepository } from "../domain/ports";

interface SessionRow {
  id: string;
  user_id: string;
  expires_at: Date;
  revoked_at: Date | null;
}

export const postgresSessionRepository: SessionRepository = {
  async create(input): Promise<void> {
    await query(
      `insert into sessions (user_id, token_hash, expires_at, ip, user_agent)
       values ($1, $2, $3, $4, $5)`,
      [input.userId, input.tokenHash, input.expiresAt, input.ip, input.userAgent],
    );
  },

  async findByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
    const { rows } = await query<SessionRow>(
      "select id, user_id, expires_at, revoked_at from sessions where token_hash = $1 limit 1",
      [tokenHash],
    );
    const row = rows[0];
    return row
      ? {
          id: row.id,
          userId: row.user_id,
          expiresAt: row.expires_at,
          revokedAt: row.revoked_at,
        }
      : null;
  },

  async revokeByTokenHash(tokenHash: string, at: Date): Promise<void> {
    await query(
      "update sessions set revoked_at = $2 where token_hash = $1 and revoked_at is null",
      [tokenHash, at],
    );
  },

  async revokeAllForUser(userId: string, at: Date): Promise<void> {
    await query(
      "update sessions set revoked_at = $2 where user_id = $1 and revoked_at is null",
      [userId, at],
    );
  },

  async deleteExpired(before: Date): Promise<void> {
    await query("delete from sessions where expires_at < $1", [before]);
  },
};
