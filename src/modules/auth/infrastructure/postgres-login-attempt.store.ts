import "server-only";
import { query } from "@/shared/db/sql";
import type { LoginAttemptStore } from "../domain/ports";

export const postgresLoginAttemptStore: LoginAttemptStore = {
  async countRecentFailures(identifier: string, since: Date): Promise<number> {
    const { rows } = await query<{ failures: number }>(
      `select count(*)::int as failures
       from login_attempts
       where lower(identifier) = lower($1)
         and success = false
         and attempted_at >= $2`,
      [identifier, since],
    );
    return rows[0]?.failures ?? 0;
  },

  async record(input): Promise<void> {
    await query("insert into login_attempts (identifier, ip, success) values ($1, $2, $3)", [
      input.identifier,
      input.ip,
      input.success,
    ]);
  },

  async clearFailures(identifier: string): Promise<void> {
    await query("delete from login_attempts where lower(identifier) = lower($1) and success = false", [
      identifier,
    ]);
  },
};
