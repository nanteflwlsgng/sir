import "server-only";
import { Pool } from "pg";
import { env } from "@/shared/config/env";

const globalForDb = globalThis as unknown as { sirPgPool?: Pool };

export const pool: Pool =
  globalForDb.sirPgPool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.sirPgPool = pool;
}
