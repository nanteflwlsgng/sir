# SIR Reboisement — v2

Refonte moderne du Système d'Information sur le Reboisement du Ministère de
l'Environnement et du Développement Durable (Madagascar).

> **État actuel : tranche verticale n°1 — Authentification, comptes & périmètre.**
> Les modules métier (campagnes, planifications, réalisations, pépinières,
> cartographie) seront ajoutés tranche par tranche.

## Stack

| Élément | Choix |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions, Turbopack) |
| Langage | TypeScript strict |
| UI | Tailwind CSS 4 |
| Base de données | PostgreSQL 16 (driver `pg`, SQL explicite) |
| Validation | Zod 4 (côté serveur) |
| Mots de passe | scrypt (module natif Node, format versionné) |
| Sessions | jetons opaques en base, cookie `HttpOnly` |

## Démarrage

```bash
# 1. Dépendances
npm install

# 2. Configuration
copy .env.example .env.local   # puis renseigner DATABASE_URL

# 3. Base de données (migrations + données de référence)
npm run db:setup

# 4. Développement
npm run dev
```

Application : http://localhost:3000

### Compte de démarrage

Créé par `npm run db:seed` :

- identifiant : `admin`
- mot de passe : `Admin@2026!`

⚠️ À changer immédiatement via **Mon compte** (ou `SEED_ADMIN_PASSWORD` avant le seed).

## Architecture

Architecture propre, découpée en **modules métier verticaux**. Chaque module
contient ses quatre couches ; les dépendances pointent vers l'intérieur.

```
db/
  migrations/                 # SQL versionné (exécuté par scripts/migrate.mjs)
scripts/
  migrate.mjs                 # exécuteur de migrations
  seed.mjs                    # référentiels + admin
  smoke.mts                   # tests d'intégration des cas d'usage
  e2e-auth.mjs                # parcours navigateur (Edge headless via CDP)
src/
  app/                        # routes Next.js (fines, sans logique métier)
    (auth)/                   # connexion, inscription
    (app)/                    # espace protégé (tableau de bord, administration)
  modules/
    auth/                     # identité, sessions, inscription, mot de passe
      domain/                 # entités + ports (interfaces)
      application/            # cas d'usage (fonctions pures, dépendances injectées)
      infrastructure/         # adapters PostgreSQL, scrypt, cookies, container
      presentation/           # server actions + composants de formulaire
    users/                    # administration des comptes
    acteurs/                  # organismes et validation
  shared/
    auth/guards.ts            # requireUser / requireAdmin / requireManager
    config/env.ts             # variables d'environnement validées
    db/                       # pool PostgreSQL + helpers SQL
    presentation/             # kit UI (Button, Field, Card, Badge, Alert…)
```

**Règles de conception**

- Aucune requête SQL hors `infrastructure/`.
- Aucune règle métier dans `app/` : les pages composent des cas d'usage.
- Les ports du domaine sont implémentés par des adapters (remplaçables).
- Chaque module expose un `container.ts` (composition root).
- Les pages protégées utilisent les gardes serveur ; chaque server action
  re-vérifie les droits (défense en profondeur).

## Tranche 1 — ce qui est livré

| Fonction | Détail |
|---|---|
| Connexion | identifiant **ou** e-mail, message d'erreur générique, verrouillage après 5 échecs / 15 min |
| Session | jeton 256 bits, hash SHA-256 en base, cookie `HttpOnly` + `SameSite=Lax`, expiration 12 h |
| Inscription | rôle **Membre imposé**, compte `en_attente`, organisme validé obligatoire |
| Validation admin | file d'attente des comptes, validation, suspension, réactivation |
| Réinitialisation | mot de passe défini par l'admin, sessions révoquées, renouvellement demandé |
| Mon compte | changement de mot de passe avec vérification de l'ancien |
| Acteurs | liste filtrable, création, validation / rejet motivé |
| Périmètre | site et région déduits de l'organisme, affichés partout |
| Audit | journal `audit_logs` (connexion, comptes, acteurs) |
| Sécurité | aucune donnée sensible dans le HTML, aucune mutation en GET, CSRF natif Next |

## Tests

```bash
npm run typecheck
npm run lint

# Intégration base réelle (cas d'usage : auth, comptes, acteurs)
npm run test:smoke

# Navigateur réel (Edge headless) : connexion → inscription → validation → accès
npm run test:e2e
```

`test:e2e` nécessite le serveur `npm run dev` démarré et Microsoft Edge installé.

## Base de données

- `roles`, `regions`, `sites`, `acteurs` — périmètres et organisations
- `users` — comptes (statuts `en_attente`, `actif`, `suspendu`, `supprime`)
- `sessions` — jetons hashés, révocables
- `login_attempts` — anti-bruteforce
- `audit_logs` — traçabilité
- `campaigns` — campagnes (une seule active)

Les codes métier historiques (`ANL_MEDD_5130`, `ITS_DREDD_7246`) seront conservés
dans les tables métier à venir, en plus d'un identifiant technique.

## Prochaines tranches

### Tranche 2 — Référentiels & Campagnes (en cours)

1. **Campagnes** : CRUD + transitions de statut (préparée/active/clôturée), règle d'unicité "une seule campagne active" à la fois.
2. **Géographie** : districts, communes, fokontany — hiérarchie complète avec codes uniques.
3. **Espèces** : catalogue d'espèces (codes métier historiques), synonymes optionnels.
4. **Types RPF** : AT, JT, PT, RT (Arbre, Jardins, Pépinières, Restitution).

### Tranche 3 — Planifications
2. **Planifications** : objectifs RPF, superficie prévue, localisation, filtres.
3. **Réalisations** : plantations multi-lignes, interventions, suivi, pièces jointes.
4. **Pépinières** : production, sorties, stock calculé.
5. **Tableau de bord & cartographie** : KPI réels, couverture du suivi, carte clusterisée.
6. **Exports & corbeilles** : XLSX filtrés, restauration, journalisation.
