-- =============================================================================
-- SIR Reboisement — tranche 2 : synonymes d'espèces
-- Migration 0007
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Synonymes d'espèces (table de liaison many-to-many optionnelle)
-- ---------------------------------------------------------------------------
create table species_synonyms (
  id          integer generated always as identity primary key,
  species_id  integer not null references species (id) on delete cascade,
  synonym     text   not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger species_synonyms_set_updated_at
  before update on species_synonyms
  for each row
  execute function set_updated_at();

create index species_synonyms_species_idx on species_synonyms (species_id);
create unique index species_synonyms_unique_synonym
  on species_synonyms (lower(synonym));

-- Seed : synonymes pour quelques espèces (ex: "Acacia mangium" → ["Acacia", "Mangium"])
-- Seed sera ajouté plus tard via scripts/seed.mjs

comment on table species_synonyms is 'Synonymes alternatifs pour les espèces dans le catalogue';