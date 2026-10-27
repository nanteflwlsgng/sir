-- =============================================================================
-- SIR Reboisement — tranche 2 : fokontany (niveau 4)
-- Migration 0005
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Fokontany (niveau 4, base de plantation)
-- ---------------------------------------------------------------------------
create table fokontany (
  id          integer generated always as identity primary key,
  code        text    not null unique,
  label       text    not null,
  commune_id  integer not null references communes (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger fokontany_set_updated_at
  before update on fokontany
  for each row
  execute function set_updated_at();

create index fokontany_commune_id_idx on fokontany (commune_id);

-- Seed : 5 fokontany par commune (ex: C001 → F001, F002, F003, F004, F005)
-- Seed sera ajouté plus tard via scripts/seed.mjs

comment on table fokontany is 'Fokontany (quartiers/secteurs) de Madagascar (niveau 4 hiérarchique depuis commune)';