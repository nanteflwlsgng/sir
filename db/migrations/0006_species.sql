-- =============================================================================
-- SIR Reboisement — tranche 2 : espèces (catalogue botanique)
-- Migration 0006
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Espèces (catalogue)
-- ---------------------------------------------------------------------------
create table species (
  id          integer generated always as identity primary key,
  code        text    not null unique,
  label       text    not null,
  family      text,
  genus       text,
  species     text,
  status      text    not null default 'actif'
                check (status in ('actif', 'inactif', 'en_revue')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger species_set_updated_at
  before update on species
  for each row
  execute function set_updated_at();

create index species_code_idx on species (code);
create index species_genus_idx on species (genus);

-- Seed : un échantillon d'espèces (codes métier historiques : SPECIES_00001, SPECIES_00002, …)
-- Seed sera ajouté plus tard via scripts/seed.mjs

comment on table species is 'Catalogue des espèces utilisées dans les plantations (codes métiers historiques conservés)';