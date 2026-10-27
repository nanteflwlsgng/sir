# Tranche 2 — Référentiels & Campagnes

## Objectif
Ajouter les **campagnes, la géographie (districts/communes/fokontany), les espèces + synonymes, les types RPF** au SIR Reboisement.

## Résumé des changements
| Module | Migrations | Domaine | Application | Présentation | Routes |
|--------|------------|---------|-------------|--------------|--------|
| campaigns | `db/migrations/0002_campaigns.sql` | `src/modules/campaigns/domain/` | `src/modules/campaigns/application/` | `src/modules/campaigns/presentation/` | `/campaigns/*` (admin uniquement) |
| geography | `db/migrations/0003_districts.sql`, `0004\communes.sql`, `0005\fokontany.sql` | `src/modules/geography/domain/` | `src/modules/geography/application/` | `src/modules/geography/presentation/` | `/referentiels/geography/*` (admin uniquement) |
| species | `db/migrations/0006_species.sql`, `0007\synonyms.sql` | `src/modules/species/domain/` | `src/modules/species/application/` | `src/modules/species/presentation/` | `/referentiels/species/*` (admin uniquement) |
| rpf-types | `db/migrations/0008\rpf_types.sql` | `src/modules/rpf-types/domain/` | `src/modules/rpf-types/application/` | `src/modules/rpf-types/presentation/` | `/referentiels/rpf-types/*` (admin uniquement) |

Tous les cas d'usage imposent des droits admin ; les gardes serveur sont déjà présentes (`requireAdmin`). Les blocs UI seront des tableaux avec filtres, pagination, et formulaires modaux.

## Architecture propre et découpée en tranches

Chaque module suit le même schéma de quatre couches ; les dépendances pointent vers l'intérieur.

```
src/modules/<module>/
  domain/          # entités + ports (tables + interfaces)
  application/     # cas d'usage (logique métier, dépendances injectées)
  infrastructure/  # adaptateurs Postgres, conteneur
  presentation/    # server actions + composants UI (Form, Table)
```

### Dépôt de campagnes

#### Entités (domain)
- **Campaign**
  - `id` (serial PK)
  - `label` (text, unique)
  - `starts_on` (date)
  - `ends_on` (date)  
  - `status` (enum: 'preparee', 'active', 'cloturee')
  - `created_at`, `updated_at` (triggers)
  - `created_by` (FK users)

#### Ports (domain/ports.ts)
```ts
export interface CampaignRepository {
  findById(id: number): Promise<Campaign | null>;
  list(filters: CampaignFilters): Promise<CampaignListItem[]>;
  create(campaign: NewCampaign, actorId: string): Promise<Campaign>;
  update(id: number, updates: Partial<Campaign>, actorId: string): Promise<Campaign>;
  delete(id: number, actorId: string): Promise<void>;
}
export type CampaignFilters = {
  status?: 'preparee' | 'active' | 'cloturee';
  search?: string;
  page?: number;
  limit?: number;
};
```

#### Cas d'usage (application)
- `listCampaigns`, `getCampaign`, `createCampaign`, `updateCampaign`, `deleteCampaign`
- Transitions de statut autorisées :
  - preparee → active (uniquement si aucune active)
  - active → cloturee (uniquement si ended < today)
  - active → preparee (redémarrer une campagne)
  - cloturee → active (redémarrer une campagne à venir)
- Validation : dates cohérentes, unique constraint respectée, règle "une campagne active".
- Audit : journal `audit_logs`.

#### Infrastructure (infrastructure)
- `postgres-campaign.repository.ts` implémentant `CampaignRepository`
- Triggers `campaigns_set_updated_at`
- Index : `campaigns_single_active_idx` (unique where status='active')
- Conteneur : `campaignsContainer` exposant tous les cas d'usage.

#### Présentation (presentation)
- `campaigns-table.tsx` (CRUD + filtres)
- `campaign-form.tsx` (modal pour créer/modifier)
- `campaign-status-badge.tsx`
- Actions serveur : `createCampaignAction`, `updateCampaignAction`, `deleteCampaignAction`, `setCampaignStatusAction`

### Module Géographie (districts/communes/fokontany)

#### Entités
- **District** (`id`, `code`, `label`, `region_id`, `created_at`, `updated_at`)
- **Commune** (`id`, `code`, `label`, `district_id`, `created_at`, `updated_at`)
- **Fokontany** (`id`, `code`, `label`, `commune_id`, `created_at`, `updated_at`)

#### Règles métier clés
- Hiérarchie : `region → district → commune → fokontany`
- Codes uniques par niveau (ex: district.code = 'D001', commune.code = 'C001', fokontany.code = 'F001')
- Valeurs de seed : une poignée de chaque type (ex: 2 districts par région, ~3 communes par district, ~5 fokontany par commune)

### Module Espèces (species + synonyms)

#### Entités
- **Species** (`id`, `code` unique, `label`, `family`, `genus`, `species`, `status` enum)
- **SpeciesSynonym** (`id`, `species_id` (FK), `synonym`, `created_at`)

#### Métadonnées historiques
- Préserver les codes métier historiques (`SPECIES_00001`, `SPECIES_00002`, …) tout en utilisant un identifiant technique en auto-incrémentation.
- Correspondre aux anciens identifiants via `species.code = 'SPECIES_' || LPAD(id::text, 5, '0')`

### Module Types RPF

#### Entités
- **RpfType** (`id`, `code` unique, `label`, `description`, `created_at`, `updated_at`)

#### Valeurs de seed
- AT, JT, PT, RT (Arbre, Jardins, Pépinières, Restitution)

## Scénarios de test

| Scénario | Scénario | Résultat attendu |
|----------|----------|------------------|
| `campagne_crud` | Admin liste, crée, modifie, supprime une campagne | Table + modale fonctionnent |
| `campaign_status_transitions` | preparee → active (success) ; active → cloturee (success) ; cloturee → preparee (success) ; active → active (pas de changement) | Transitions autorisées, validation exécutée |
| `single_active_enforcement` | Tentative de création d'une campagne active alors qu'une autre est active | Échec avec message de champ d'erreur |
| `campaign_expiry` | Une campagne se termine automatiquement quand la date atteint aujourd'hui | Status update appliqué par le service |
| `geography_hierarchy` | CRUD sur districts, puis sous-éléments | Nœuds parents et enfants s'affichent |
| `species_synonyms` | Créer une espèce avec un synonyme, lister les synonymes | Formulaire à plusieurs lignes fonctionne |

Tous exécutés via `npm run test:smoke` (cas d'usage de bout en bout) et `npm run test:e2e` (navigation admin).

## Pages UI (à venir plus tard)

```
/src/app/(app)/campaigns/page.tsx           # /campaigns (liste + modale)
/src/app/(app)/campaigns/[id]/edit/page.tsx # édition
/src/app/(app)/referentiels/geography/page.tsx   # arborescence géographique
/src/app/(app)/referentiels/species/page.tsx    # catalogue espèces
/src/app/(app)/referentiels/rpf-types/page.tsx   # types RPF
```

## Défauts connus

- Aucun connu pour cette slice.

## Plan d'implémentation étape par étape

1. **Écrire les migrations** (scripts `db/migrations/`)
2. **Créer les repositories** (infrastructure)
3. **Développer les cas d'usage** (application) avec validation Zod et transitions de statut
4. **Exposer les actions serveur** (présentation)
5. **Construire les composants UI** (présentation)
6. **Ajouter les routes** (app router)
7. **Ajouter les scripts de test** (smoke + e2e)
8. **Exécuter la vérification complète** (`typecheck`, `lint`, `build`, `test:smoke`, `test:e2e`)

## État actuel

- **Base de données :** schéma 0001 en place ; tables 0002-0008 à créer.
- **Conteneurs :** nouveau sous-répertoire `src/modules/<module>/infrastructure/container.ts` par module.
- **Gardes :** déjà appliquées (`requireAdmin`, `requireManager`). Aucune nouvelle garde nécessaire.
- **Scripts :** migrer et seed intégrés, `test:smoke` exécutable dès que les migrations sont prêtes.

### Bloc de départ recommandé
Lancer le script de migration (`npm run db:migrate`) après avoir écrit `0002_campaigns.sql` (les migrations antérieures resteront en attente).

---

*Slice suivante après la validation : Tranche 3 — Planifications (objectifs RPF, superficie prévue, localisation).*