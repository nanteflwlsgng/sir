-- =============================================================================
-- SIR Reboisement — tranche 2 : commune (géographie)
-- Migration 0004
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Communes (niveau 3)
-- ---------------------------------------------------------------------------
create table communes (
  id           integer generated always as identity primary key,
  code         text     not null unique,
  label        text     not null,
  district_id  integer  not null references districts (id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger communes_set_updated_at
  before update on communes
  for each row
  execute function set_updated_at();

create index communes_district_id_idx on communes (district_id);

-- Seed : 3 communes par district (ex: D001 → C001, C002, C003)
-- Seed sera ajouté plus tard via scripts/seed.mjs

comment on table communes is 'Communes de Madagascar (niveau 3 hiérarchique depuis district)';