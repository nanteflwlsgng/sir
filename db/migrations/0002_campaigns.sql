-- =============================================================================
-- SIR Reboisement — tranche 2 : campagne (niveau supérieur)
-- Migration 0002
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Table des campagnes
-- ---------------------------------------------------------------------------
create table campaigns (
  id          integer generated always as identity primary key,
  label       text    not null unique,
  starts_on   date    not null,
  ends_on     date    not null,
  status      text    not null default 'preparee'
                check (status in ('preparee', 'active', 'cloturee')),
  created_by  uuid    not null references users (id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Trigger pour mise à jour automatique de updated_at
-- ---------------------------------------------------------------------------
create or replace function campaigns_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger campaigns_set_updated_at
  before update on campaigns
  for each row
  execute function campaigns_set_updated_at();

-- ---------------------------------------------------------------------------
-- Constrainte métier : une seule campagne active à la fois
-- ---------------------------------------------------------------------------ncreate unique index campaigns_single_active_idx
  on campaigns (status)
  where status = 'active';

-- ---------------------------------------------------------------------------
-- Index utiles
-- ---------------------------------------------------------------------------
create index campaigns_status_idx on campaigns (status);
create index campaigns_dates_idx on campaigns (starts_on, ends_on);

comment on column campaigns.status is 'Hiérarchie : preparee → active → cloturee, redémarrage possible depuis cloturee/preparee';