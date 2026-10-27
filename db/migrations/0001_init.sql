-- =============================================================================
-- SIR Reboisement v2 — socle : identités, périmètres, sessions, audit
-- Migration 0001
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Fonction générique de mise à jour de updated_at
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Rôles applicatifs
-- ---------------------------------------------------------------------------
create table roles (
  id          smallint generated always as identity primary key,
  code        text     not null unique,
  label       text     not null,
  rank        smallint not null unique,
  created_at  timestamptz not null default now()
);

comment on column roles.rank is 'Hiérarchie : 10=membre, 50=admin suppléant, 100=administrateur';

-- ---------------------------------------------------------------------------
-- Référentiel géographique (niveau région ; districts/communes en migration 0002)
-- ---------------------------------------------------------------------------
create table regions (
  id          integer generated always as identity primary key,
  code        text    not null unique,
  label       text    not null unique,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Sites / directions (CENTRAL, DIREDD, DREDD, CIREDD)
-- ---------------------------------------------------------------------------
create table sites (
  id          integer generated always as identity primary key,
  code        text    not null unique,
  label       text    not null,
  kind        text    not null check (kind in ('CENTRAL', 'DIREDD', 'DREDD', 'CIREDD')),
  region_id   integer references regions (id) on delete restrict,
  created_at  timestamptz not null default now()
);

create index sites_region_id_idx on sites (region_id);

-- ---------------------------------------------------------------------------
-- Acteurs (personnes morales)
-- ---------------------------------------------------------------------------
create table acteurs (
  id            integer generated always as identity primary key,
  abbreviation  text    not null,
  name          text    not null,
  type          text    not null default 'ASSOCIATION',
  site_id       integer not null references sites (id) on delete restrict,
  region_id     integer not null references regions (id) on delete restrict,
  status        text    not null default 'soumis'
                  check (status in ('soumis', 'valide', 'rejete')),
  rejection_reason text,
  submitted_by  uuid,
  validated_by  uuid,
  validated_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index acteurs_abbreviation_key on acteurs (lower(abbreviation));
create unique index acteurs_name_key on acteurs (lower(name));
create index acteurs_status_idx on acteurs (status);
create index acteurs_site_id_idx on acteurs (site_id);

create trigger acteurs_set_updated_at
  before update on acteurs
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Utilisateurs
-- ---------------------------------------------------------------------------
create table users (
  id                    uuid        primary key default gen_random_uuid(),
  username              text        not null,
  email                 text        not null,
  password_hash         text        not null,
  first_name            text        not null,
  last_name             text        not null,
  role_id               smallint    not null references roles (id) on delete restrict,
  acteur_id             integer     not null references acteurs (id) on delete restrict,
  status                text        not null default 'en_attente'
                          check (status in ('en_attente', 'actif', 'suspendu', 'supprime')),
  must_change_password  boolean     not null default false,
  confirmed_at          timestamptz,
  last_login_at         timestamptz,
  created_by            uuid        references users (id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz
);

create unique index users_username_key on users (lower(username)) where deleted_at is null;
create unique index users_email_key on users (lower(email)) where deleted_at is null;
create index users_status_idx on users (status);
create index users_acteur_id_idx on users (acteur_id);

create trigger users_set_updated_at
  before update on users
  for each row execute function set_updated_at();

alter table acteurs
  add constraint acteurs_submitted_by_fkey foreign key (submitted_by) references users (id) on delete set null,
  add constraint acteurs_validated_by_fkey foreign key (validated_by) references users (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Sessions opaques (jeton aléatoire, seul le hash SHA-256 est stocké)
-- ---------------------------------------------------------------------------
create table sessions (
  id            uuid        primary key default gen_random_uuid(),
  token_hash    text        not null unique,
  user_id       uuid        not null references users (id) on delete cascade,
  expires_at    timestamptz not null,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  revoked_at    timestamptz,
  ip            inet,
  user_agent    text
);

create index sessions_user_id_idx on sessions (user_id);
create index sessions_expires_at_idx on sessions (expires_at);

-- ---------------------------------------------------------------------------
-- Tentatives de connexion (anti-bruteforce)
-- ---------------------------------------------------------------------------
create table login_attempts (
  id            bigint      generated always as identity primary key,
  identifier    text        not null,
  ip            inet,
  success       boolean     not null,
  attempted_at  timestamptz not null default now()
);

create index login_attempts_identifier_idx
  on login_attempts (lower(identifier), attempted_at desc);

-- ---------------------------------------------------------------------------
-- Journal d'audit
-- ---------------------------------------------------------------------------
create table audit_logs (
  id            bigint      generated always as identity primary key,
  actor_user_id uuid        references users (id) on delete set null,
  action        text        not null,
  entity        text        not null,
  entity_id     text,
  before        jsonb,
  after         jsonb,
  ip            inet,
  user_agent    text,
  created_at    timestamptz not null default now()
);

create index audit_logs_actor_idx on audit_logs (actor_user_id, created_at desc);
create index audit_logs_entity_idx on audit_logs (entity, entity_id);

-- ---------------------------------------------------------------------------
-- Campagnes (transversal, une seule active)
-- ---------------------------------------------------------------------------
create table campaigns (
  id          integer generated always as identity primary key,
  label       text    not null unique,
  starts_on   date    not null,
  ends_on     date    not null,
  status      text    not null default 'preparee'
                check (status in ('preparee', 'active', 'cloturee')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint campaigns_dates_check check (ends_on > starts_on)
);

create unique index campaigns_single_active_idx on campaigns (status) where status = 'active';

create trigger campaigns_set_updated_at
  before update on campaigns
  for each row execute function set_updated_at();
