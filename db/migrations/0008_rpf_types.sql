-- =============================================================================
-- SIR Reboisement — tranche 2 : types RPF (Objectifs de Reboisement de Forêt)
-- Migration 0008
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Types RPF (catégories d'objectifs)
-- ---------------------------------------------------------------------------
create table rpf_types (
  id          integer generated always as identity primary key,
  code        text    not null unique,
  label       text    not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger rpf_types_set_updated_at
  before update on rpf_types
  for each row
  execute function set_updated_at();

comment on table rpf_types is 'Types d''objectifs RPF (Arbre, Jardins, Pépinières, Restitution)';