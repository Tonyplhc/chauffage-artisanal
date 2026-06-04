# README développeur

Guide d'orientation rapide pour quiconque reprend le projet. Pas un tutoriel
Next.js — un manuel d'architecture maison.

## Stack

- **Next.js 14.2.18** (App Router) avec TypeScript strict
- **Tailwind CSS 3.4** avec palette custom (cream/copper/ember/ink/graphite/charcoal)
- **lucide-react** pour les icônes
- **Zod 4** pour les schémas et la validation
- **framer-motion** pour les transitions
- **Resend** pour l'email (mode console-fallback en dev)
- **Stripe** pour les paiements (mode demo-fallback en dev)
- **xlsx** pour l'import/export Excel
- Stockage : fichiers JSON dans `data/` (adapter Supabase optionnel)

Aucune dépendance LLM. Toutes les "intelligences" sont rules-based +
statistiques transparentes.

## Démarrage

```bash
npm install
npm run dev          # http://localhost:3020
npm run seed:demo    # générer 80 leads démo réalistes
npm run smoke        # tests de fumée des modules critiques
```

Variables d'environnement (toutes optionnelles en dev) :

```
SESSION_SECRET=...              # signe les cookies session admin
SESSION_TTL_HOURS=24
ADMIN_PASSWORD_HASH=...         # Argon2id (1 admin par défaut)
RESEND_API_KEY=...              # sinon mode console
STRIPE_SECRET_KEY=...           # sinon mode demo
SUPABASE_URL=...                # sinon file-store
SUPABASE_SERVICE_ROLE_KEY=...
```

## Arborescence

```
app/                    Pages Next.js (App Router)
├── admin/             Espace admin protégé (middleware)
│   ├── leads/         Pipeline principal
│   ├── stats/         Dashboards analytics
│   └── ... (~60 pages)
├── api/               Routes API
│   ├── admin/         Endpoints admin protégés
│   └── ... (devis, bookings, recap public, etc.)
├── outils/            Calculateurs publics (PAC, ROI, Klimabonus...)
├── services/          Pages métier (chauffage, PAC, clim, ENR...)
├── ressources/        Hub centralisé outils + guides
└── ... (formulaire devis, blog, légal, etc.)

components/
├── admin/             Composants admin (KpiCard, AdminMenu, TourOverlay...)
├── ui-kit.tsx         Kit partagé (KpiCard, EmptyState, SectionCard...)
└── ... (Nav, Footer, EmergencyBar...)

lib/                   Logique métier + stores
├── *-store.ts         Stores fichiers (CRUD CRUD JSON)
├── *-checker.ts       Moteurs de règles (klimabonus, sentiment...)
├── *-simulator.ts     Calculateurs (ROI, PAC sizing, déperditions...)
├── auth.ts            Sessions HMAC
├── formatters.ts      Helpers format EUR/dates/%
└── ... (~70 modules)

data/                  Stockage runtime (gitignored)
├── leads.json
├── invoices.json
└── ... 1 fichier par store

scripts/               Outils CLI
├── seed-demo.mjs
└── smoke-tests.mjs

supabase/migrations/   SQL pour bascule Supabase
```

## Conventions

### Stores fichiers

Pattern uniforme pour tous les stores `lib/*-store.ts` :

```ts
const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "things.json");

async function ensureDir() { try { await fs.mkdir(DATA_DIR, { recursive: true }); } catch {} }
async function readAll(): Promise<Thing[]> { try { return JSON.parse(await fs.readFile(FILE, "utf8")); } catch { return []; } }
async function writeAll(arr: Thing[]) { await ensureDir(); await fs.writeFile(FILE, JSON.stringify(arr, null, 2), "utf8"); }

function makeId(): string { return `prefix-${randomBytes(5).toString("hex")}`; }

export async function listThings()    { return await readAll(); }
export async function getThing(id)    { return (await readAll()).find(t => t.id === id) ?? null; }
export async function createThing(...) { /* read, validate, push, write */ }
export async function updateThing(id, patch) { /* read, find, patch, write */ }
export async function deleteThing(id) { /* read, filter, write */ }
```

Cap les fichiers à 5000 entrées si append fréquent (cf. `activity-log.ts`).

### Routes API admin

Pattern auth (W36.1) :

```ts
import { requireAdminApi } from "@/lib/require-admin";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  // ... auth.session disponible
}
```

### UI admin

Utiliser le **kit partagé** `components/admin/ui-kit.tsx` :

```tsx
<AdminPageShell title="..." description="..." actions={<button>...</button>}>
  <KpiCard label="..." value="..." />
  <SectionCard icon={Foo} eyebrow="...">
    {data === null ? <CenteredLoader />
     : data.length === 0 ? <EmptyState icon={Bar} title="..." />
     : <table>...</table>}
  </SectionCard>
</AdminPageShell>
```

Et les **formatters** centralisés `lib/formatters.ts` :

```tsx
import { formatEur, formatDateShort, formatPercent } from "@/lib/formatters";
```

### Navigation admin

`components/admin/admin-menu.tsx` — menu structuré en 5 catégories
(Pipeline / Analytics / Ops / Config / Aide). Pour ajouter une nouvelle page
admin, ajouter l'entrée dans `CATEGORIES`.

### Activity log

Toute action notable doit être loggée :

```ts
void logActivity("admin.thing_created", `Chose créée : ${name}`, { meta: { id } });
```

Le type `ActivityType` est strict — étendre l'union dans `lib/activity-log.ts`.

### Discipline éditoriale (CRITIQUE)

**INTERDIT** d'inventer :
- Prix précis (sauf fourchettes explicitement notées "indicatif")
- Certifications constructeur non vérifiées
- Nombre d'employés / années d'expérience non confirmés
- COP mesuré sans audit terrain
- Témoignages clients (les fixtures démo sont marquées `seedDemo: true`)
- Contrats / partenaires constructeurs

**Toujours** :
- "Sur devis" si pas de grille tarifaire client
- "À confirmer avec le client" pour tout chiffre interne
- Référence officielle (klimabonus.lu, CNPD) pour les contenus réglementaires

Voir `content-truth-audit.md` pour la liste exhaustive.

## Ajouter une feature

1. **Store** : `lib/feature-store.ts` (pattern ci-dessus)
2. **API admin** : `app/api/admin/feature/route.ts` avec `requireAdminApi`
3. **Type ActivityType** : étendre l'union si action loggée
4. **Page admin** : `app/admin/feature/page.tsx` avec `AdminPageShell` + ui-kit
5. **Lien menu** : ajouter dans `CATEGORIES` de `admin-menu.tsx`
6. **Smoke test** : ajouter une assertion dans `scripts/smoke-tests.mjs`
7. **Discipline** : commenter le module (1 paragraphe en tête expliquant
   POURQUOI cette feature existe et ses LIMITES)

## Déboguer

- **Cache Next** : `rm -rf .next` puis relancer
- **Stores** : ouvrir `data/*.json` à la main
- **Sessions admin** : cookie `ca-admin`, secret HMAC dans .env
- **Logs structurés** : `lib/logger.ts` (console en dev, Sentry-ready)
- **Activity log UI** : `/admin/activity` montre toutes les actions tracées

## Migration vers Supabase

`lib/leads-store.ts` montre le pattern dual : si `SUPABASE_URL` +
`SUPABASE_SERVICE_ROLE_KEY` sont définis, bascule auto sur l'API Supabase
REST. Les autres stores sont uniquement fichiers — à étendre au besoin.

Migrations SQL dans `supabase/migrations/*.sql`.

## Pitch client

- `STORYLINE-PITCH-15MIN.md` — script de présentation 15 min
- `/admin/guide` — guide utilisateur imprimable
- `/admin/onboarding` → bouton "Générer 80 leads démo"
- Tour interactif disponible depuis le guide (8 étapes)

## Tests

```bash
npm run smoke    # vérifications statiques de logique métier
```

Pas de tests E2E formels (Playwright/Cypress) — projet portfolio. À ajouter
avant production.

## Production

`PRODUCTION-CHECKLIST.md` liste les actions avant mise en prod (vrais
secrets, Supabase, monitoring, sauvegardes, certificats).

## Contacts

Repo et conventions tenus par l'équipe Chauffage Artisanal. Pour reprendre
un projet froid, commencer par lancer `npm run dev` + `npm run seed:demo` et
naviguer dans `/admin/leads`. Tout part de là.
