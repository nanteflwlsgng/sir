# Graph Report - sir  (2026-10-27)

## Corpus Check
- Corpus is ~21,677 words - fits in a single context window. You may not need a graph.

## Summary
- 522 nodes · 1248 edges · 22 communities (17 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Next.js Routes and Pages
- Application Services
- Packages and Tooling
- Authentication UI
- Layouts and Shared UI
- Actor Administration
- Use Case Smoke Tests
- Account and Role Domain
- Login and Session Security
- Node Scripts and Migrations
- Account Workflows
- Campaign and Reference Concepts
- TypeScript Configuration
- Account Repository Ports
- Architecture and Framework Guidance
- Login Protection Adapters
- Geographic Types
- Species Catalog Types
- RPF Type Reference
- Next.js Agent Feedback
- Planning Roadmap

## God Nodes (most connected - your core abstractions)
1. `next` - 27 edges
2. `Alert()` - 22 edges
3. `server-only` - 20 edges
4. `cn()` - 20 edges
5. `SubmitButton()` - 19 edges
6. `AuthenticatedUser` - 18 edges
7. `AccountRepository` - 18 edges
8. `react` - 17 edges
9. `SessionRepository` - 17 edges
10. `compilerOptions` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Four-Layer Module Architecture` --semantically_similar_to--> `Vertical Business-Module Architecture`  [INFERRED] [semantically similar]
  docs/SLICE2_CAMPAGNES_REFERENTIELS.md → README.md
- `Single Active Campaign Constraint` --semantically_similar_to--> `Single Active Campaign Rule`  [INFERRED] [semantically similar]
  README.md → docs/SLICE2_CAMPAGNES_REFERENTIELS.md
- `Tranche 2 — Reference Data and Campaigns` --references--> `Tranche 2 — Référentiels & Campagnes`  [EXTRACTED]
  README.md → docs/SLICE2_CAMPAGNES_REFERENTIELS.md
- `main()` --calls--> `query()`  [EXTRACTED]
  scripts/smoke.mts → src/shared/db/sql.ts
- `ActeurForm()` --indirect_call--> `createActeurAction()`  [INFERRED]
  src/modules/acteurs/presentation/acteur-form.tsx → src/modules/acteurs/presentation/actions.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Tranche 2 Reference Data and Campaign Modules** — docs_slice2_campagnes_referentiels_campaigns_module, docs_slice2_campagnes_referentiels_geography_module, docs_slice2_campagnes_referentiels_species_module, docs_slice2_campagnes_referentiels_rpf_types_module [EXTRACTED 1.00]

## Communities (22 total, 5 thin omitted)

### Community 0 - "Next.js Routes and Pages"
Cohesion: 0.07
Nodes (54): nextConfig, next, ActeursPage(), ERROR_MESSAGES, isStatus(), metadata, OK_MESSAGES, TABS (+46 more)

### Community 1 - "Application Services"
Cohesion: 0.07
Nodes (30): zod@^4.6.7, zod, AuthenticatedUser, assertAdmin(), AuditLogger, CampaignActionResult, CampaignAdminDeps, createCampaignAdmin() (+22 more)

### Community 2 - "Packages and Tooling"
Cohesion: 0.05
Nodes (50): dependencies, clsx@^2.1.1, lucide-react@^1.56.0, next@16.4.3, pg@^8.23.1, react@19.3.0, react-dom@19.3.0, recharts@^3.10.1 (+42 more)

### Community 3 - "Authentication UI"
Cohesion: 0.11
Nodes (34): react, LoginPage(), metadata, metadata, RegisterPage(), ActeurForm(), authContainer, ChangePasswordForm() (+26 more)

### Community 4 - "Layouts and Shared UI"
Cohesion: 0.08
Nodes (32): AuthLayout(), HomePage(), RegisterField, changePasswordSchema, emailSchema, loginSchema, PASSWORD_MIN_LENGTH, passwordSchema (+24 more)

### Community 5 - "Actor Administration"
Cohesion: 0.11
Nodes (23): ActeurActionResult, ActeurAdministrationDeps, ActeurField, acteurSchema, createActeurAdministration(), CreateActeurResult, ACTEUR_TYPES, ActeurAdminRepository (+15 more)

### Community 6 - "Use Case Smoke Tests"
Cohesion: 0.14
Nodes (20): server-only, acteurs, changeOwnPassword, check(), deps, login, main(), register (+12 more)

### Community 7 - "Account and Role Domain"
Cohesion: 0.11
Nodes (17): ActeurSummary, RegionSummary, Role, RoleCode, SiteSummary, UserStatus, CreateAccountInput, AccountRow (+9 more)

### Community 8 - "Login and Session Security"
Cohesion: 0.12
Nodes (13): createLogin(), LoginFailure, LoginInput, LoginResult, createLogout(), LogoutDeps, createResolveSession(), ResolveSessionDeps (+5 more)

### Community 9 - "Node Scripts and Migrations"
Cohesion: 0.12
Nodes (16): pg, browser, check(), connect(), main(), NEW_USER, sleep(), SUFFIX (+8 more)

### Community 10 - "Account Workflows"
Cohesion: 0.15
Nodes (13): ChangeOwnPasswordDeps, ChangeOwnPasswordResult, createChangeOwnPassword(), LoginDeps, createRegister(), RegisterDeps, RegisterResult, AuditEntry (+5 more)

### Community 11 - "Campaign and Reference Concepts"
Cohesion: 0.13
Nodes (19): Campaign Entity, Campaign Status Transitions, Campaigns Module, Commune, District, Fokontany, Region–District–Commune–Fokontany Hierarchy, Geography Module (+11 more)

### Community 12 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 13 - "Account Repository Ports"
Cohesion: 0.18
Nodes (5): AccountWithSecret, AccountRepository, findAccountById(), mapRow(), postgresAccountRepository

### Community 14 - "Architecture and Framework Guidance"
Cohesion: 0.15
Nodes (9): Acteurs Module, Authentication Module, Domain, Application, Infrastructure, and Presentation Layers, Next.js 16, PostgreSQL 16, SIR Reboisement, Tranche 1 — Authentication, Accounts, and Scope, Users Module (+1 more)

### Community 15 - "Login Protection Adapters"
Cohesion: 0.32
Nodes (4): postgresLoginAttemptStore, PARAMS, scrypt, scryptPasswordHasher

### Community 16 - "Geographic Types"
Cohesion: 0.40
Nodes (3): Commune, District, Fokontany

## Knowledge Gaps
- **13 isolated node(s):** `Experimental Next.js Agent Feedback`, `PostgreSQL 16`, `Zod 4`, `Users Module`, `Acteurs Module` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 178 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Next.js Routes and Pages` to `Application Services`, `Packages and Tooling`, `Authentication UI`, `Layouts and Shared UI`, `Actor Administration`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **What connects `Experimental Next.js Agent Feedback`, `PostgreSQL 16`, `Zod 4` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Next.js Routes and Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.06885758998435054 - nodes in this community are weakly interconnected._
- **Why does `server-only` connect `Use Case Smoke Tests` to `Next.js Routes and Pages`, `Application Services`, `Packages and Tooling`, `Layouts and Shared UI`, `Actor Administration`, `Account Workflows`, `Account Repository Ports`, `Login Protection Adapters`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Should `Application Services` be split into smaller, more focused modules?**
  _Cohesion score 0.07272727272727272 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Authentication UI` to `Next.js Routes and Pages`, `Application Services`, `Packages and Tooling`, `Layouts and Shared UI`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `Packages and Tooling` be split into smaller, more focused modules?**
  _Cohesion score 0.05052790346907994 - nodes in this community are weakly interconnected._