#!/usr/bin/env node
/**
 * Exécuteur de migrations SQL.
 * Usage : npm run db:migrate
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const MIGRATIONS_DIR = path.join(process.cwd(), "db", "migrations");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL manquant. Lancez `node --env-file=.env.local scripts/migrate.mjs`.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();

  await client.query(`
    create table if not exists schema_migrations (
      filename    text        primary key,
      applied_at  timestamptz not null default now()
    );
  `);

  const { rows } = await client.query("select filename from schema_migrations");
  const applied = new Set(rows.map((row) => row.filename));

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`= déjà appliquée : ${file}`);
      continue;
    }

    const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
    console.log(`→ application : ${file}`);
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into schema_migrations (filename) values ($1)", [file]);
      await client.query("commit");
      count += 1;
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }

  console.log(count === 0 ? "Base à jour." : `${count} migration(s) appliquée(s).`);
} catch (error) {
  console.error("Échec de migration :", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
