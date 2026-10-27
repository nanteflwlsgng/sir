-- =============================================================================
-- SIR Reboisement — tranche 2 : district (géographie)
-- Migration 0003
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Districts (niveau 2)
-- ---------------------------------------------------------------------------
create table districts (
  id          integer generated always as identity primary key,
  code        text    not null unique,
  label       text    not null,
  region_id   integer not null references regions (id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger districts_set_updated_at
  before update on districts
  for each row
  execute function set_updated_at();

create index districts_region_id_idx on districts (region_id);

-- ---------------------------------------------------------------------------
-- Seed : 2 districts par région (ex: "ANL" → "Analamanga", "VKN" → "Vakinankaratra")
-- ---------------------------------------------------------------------------
-- Seed sera ajouté plus tard via scripts/seed.mjs

comment on table districts is 'Districts de Madagascar (niveau 2 hiérarchique depuis region)';