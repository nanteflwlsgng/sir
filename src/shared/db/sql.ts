import "server-only";
import type { PoolClient, QueryResult, QueryResultRow } from "pg";
import { pool } from "./pool";

/** Exécute une requête SQL paramétrée. Toute requête applicative passe par ici. */
export async function query<T extends QueryResultRow>(
  text: string,
  params: readonly unknown[] = [],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params as unknown[]);
}

/** Exécute un bloc dans une transaction. */
export async function withTransaction<T>(run: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await run(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
