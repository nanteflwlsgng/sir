#!/usr/bin/env node
/**
 * Données de référence minimales + compte administrateur de démarrage.
 * Usage : npm run db:seed
 *
 * Le format de hash doit rester aligné sur src/modules/auth/infrastructure/scrypt-password-hasher.ts
 */
import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import process from "node:process";
import pg from "pg";

const scrypt = promisify(scryptCallback);

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };
const ADMIN = {
  username: "admin",
  email: "admin@sir.mg",
  password: process.env.SEED_ADMIN_PASSWORD ?? "Admin@2026!",
  firstName: "Administrateur",
  lastName: "SIR",
};

async function hashPassword(plain) {
  const salt = randomBytes(16);
  const derived = await scrypt(plain.normalize("NFKC"), salt, SCRYPT.keylen, {
    N: SCRYPT.N,
    r: SCRYPT.r,
    p: SCRYPT.p,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

const REGIONS = [
  ["ANL", "Analamanga"],
  ["VKN", "Vakinankaratra"],
  ["ITS", "Itasy"],
  ["BGL", "Bongolava"],
  ["MTR", "Haute Matsiatra"],
  ["AMM", "Amoron'i Mania"],
  ["IHR", "Ihorombe"],
  ["AAT", "Atsimo-Atsinanana"],
  ["FIT", "Fitovinany"],
  ["VTV", "Vatovavy"],
  ["ATN", "Atsinanana"],
  ["ANJ", "Analanjirofo"],
  ["ALA", "Alaotra-Mangoro"],
  ["AMB", "Ambatosoa"],
  ["SAV", "Sava"],
  ["DIA", "Diana"],
  ["SFA", "Sofia"],
  ["BNY", "Boeny"],
  ["BTK", "Betsiboka"],
  ["MLK", "Melaky"],
  ["MNB", "Menabe"],
  ["AAD", "Atsimo-Andrefana"],
  ["AND", "Androy"],
  ["ANS", "Anosy"],
];

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL manquant.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();
  await client.query("begin");

  for (const [code, label, rank] of [
    ["membre", "Membre", 10],
    ["admin_suppleant", "Administrateur suppléant", 50],
    ["admin", "Administrateur", 100],
  ]) {
    await client.query(
      `insert into roles (code, label, rank) values ($1, $2, $3)
       on conflict (code) do update set label = excluded.label, rank = excluded.rank`,
      [code, label, rank],
    );
  }

  for (const [code, label] of REGIONS) {
    await client.query(
      `insert into regions (code, label) values ($1, $2)
       on conflict (code) do update set label = excluded.label`,
      [code, label],
    );
  }

  const { rows: regionRows } = await client.query("select id, code, label from regions");
  const regionByCode = new Map(regionRows.map((row) => [row.code, row]));

  const centralRegion = regionByCode.get("ANL");
  const { rows: centralRows } = await client.query(
    `insert into sites (code, label, kind, region_id) values ('CENTRAL', 'CENTRAL', 'CENTRAL', $1)
     on conflict (code) do update set label = excluded.label
     returning id`,
    [centralRegion.id],
  );
  const centralSiteId = centralRows[0].id;

  for (const [code, label] of REGIONS) {
    const region = regionByCode.get(code);
    await client.query(
      `insert into sites (code, label, kind, region_id) values ($1, $2, 'DREDD', $3)
       on conflict (code) do update set label = excluded.label, region_id = excluded.region_id`,
      [`DREDD_${code}`, `DREDD ${label}`, region.id],
    );
  }

  const { rows: acteurRows } = await client.query(
    `insert into acteurs (abbreviation, name, type, site_id, region_id, status, validated_at)
     values ('MEDD', 'Ministère de l''Environnement et du Développement Durable',
             'INSTITUTION PUBLIQUE', $1, $2, 'valide', now())
     on conflict (lower(abbreviation)) do update set name = excluded.name
     returning id`,
    [centralSiteId, centralRegion.id],
  );
  const acteurId = acteurRows[0].id;

  for (const [label, startsOn, endsOn, status] of [
    ["2024-2025", "2024-07-01", "2025-06-30", "cloturee"],
    ["2025-2026", "2025-07-01", "2026-06-30", "active"],
    ["2026-2027", "2026-07-01", "2027-06-30", "preparee"],
  ]) {
    await client.query(
      `insert into campaigns (label, starts_on, ends_on, status) values ($1, $2, $3, $4)
       on conflict (label) do update set status = excluded.status`,
      [label, startsOn, endsOn, status],
    );
  }

  const { rows: existingAdmin } = await client.query(
    "select id from users where lower(username) = lower($1) and deleted_at is null",
    [ADMIN.username],
  );

  if (existingAdmin.length === 0) {
    const passwordHash = await hashPassword(ADMIN.password);
    await client.query(
      `insert into users (username, email, password_hash, first_name, last_name, role_id, acteur_id, status, confirmed_at)
       select $1, $2, $3, $4, $5, r.id, $6, 'actif', now()
       from roles r where r.code = 'admin'`,
      [ADMIN.username, ADMIN.email, passwordHash, ADMIN.firstName, ADMIN.lastName, acteurId],
    );
    console.log(`Compte administrateur créé : ${ADMIN.username} / ${ADMIN.password}`);
    console.log("⚠ Changez ce mot de passe après la première connexion (Mon compte).");
  } else {
    console.log("Compte administrateur déjà présent.");
  }

  await client.query("commit");
  console.log("Seed terminé.");
} catch (error) {
  await client.query("rollback");
  console.error("Échec du seed :", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
