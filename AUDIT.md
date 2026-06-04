# AUDIT COMPLET — Chauffage Artisanal

> **Date :** 2026-06-04 · **Mode :** lecture seule (analyse, aucune correction appliquée)
> **Stack :** Next.js 14.2.18 (App Router) · React 18 · TypeScript 5.6 · Tailwind 3.4 · Zod 4 · Supabase (optionnel) · Vercel
> **Statut :** En attente de **validation** avant toute modification.

Cet audit couvre les 10 axes demandés. Chaque constat est classé **🔴 Critique**, **🟠 Important** ou **🟡 Mineur**, avec le fichier:ligne en preuve. La synthèse chiffrée et le plan d'action figurent dans `QUICK_WINS.md` et `ROADMAP.md`.

---

## 0. Synthèse exécutive

| Axe | Verdict | Constats |
|---|---|---|
| Architecture | Très riche, mais monolithe client | 156 pages · 184 routes API · 89 composants · 141 modules `lib` · ~108 k LOC |
| SEO technique | Bonnes fondations, **2 fuites critiques** | canonical hérité `/`, hreflang factice |
| Performance | **Tout client-side** | home 100 % `"use client"`, framer-motion sur le LCP, 0 `next/dynamic` |
| Erreurs de code | **Masquées par la config build** | 53 erreurs `tsc`, 96 `catch {}` vides cachant des bugs réels |
| Composants inutilisés | Codebase propre | 3 composants morts, 0 module `lib` orphelin |
| Dépendances inutiles | Saines | 0 dép. runtime inutile · **1 dép. manquante** (`@playwright/test`) |
| Sécurité | Solide à 99 %, **1 bypass critique** | 2 routes admin sans auth réelle (fuite de secrets + envoi d'emails) |
| Accessibilité | **Plusieurs bloqueurs WCAG** | labels manquants, pas de focus trap, contrastes sous AA |
| UX/UI | Cohérent, surcharge CTA | 5 incitations concurrentes + collision de FABs mobile |

**À retenir :** le code est ambitieux et globalement bien structuré (auth HMAC, headers OWASP, JSON-LD riche, service worker soigné). Les risques majeurs ne sont pas dans le « gros » du code mais dans **3 angles morts** : (1) un bypass d'authentification sur 2 routes de diagnostic, (2) une config build qui masque 53 erreurs TS dont plusieurs bugs fonctionnels réels, (3) une architecture 100 % client qui plombe la performance et l'accessibilité.

---

## 1. Cartographie de l'architecture

### Arborescence

```
app/
├── (public)            ~65 pages    home, services, SEO-LU, marques, outils, zones, actualités, légal
├── admin/              ~90 pages    cockpit CRM/ERP complet (leads, devis, planning, stats, RGPD…)
├── api/                184 routes   /api/* (public) + /api/admin/* (protégé)
├── layout.tsx          racine — 14 composants montés site-wide
├── sitemap.ts · robots.ts · manifest.ts · opengraph-image.tsx · icon.tsx · apple-icon.tsx
components/             89 composants
├── home/               13 sections de la home (toutes "use client")
├── admin/              ~40 composants cockpit
├── devis/              configurateur multi-étapes
└── (racine)            nav, footer, ui-kit, calculateurs, cartes, widgets flottants
lib/                    141 modules — stores (fichier/Supabase/mémoire), schémas Zod, contenus, helpers
data/                   persistance fichier (leads.json ~118 ko, analytics, chat…)
supabase/migrations/    schéma SQL
public/                 sw.js (service worker), assets
middleware.ts           edge — check existence cookie session
next.config.mjs         CSP + headers OWASP + images + webpack node:* stub
```

### Couches & flux

- **Présentation :** App Router, mélange Server/Client Components — mais le `layout.tsx` racine monte 14 composants client (`I18nProvider`, `Nav`, `CommandPalette`, `ChatWidget`, `AnalyticsTracker`…) qui « clientisent » l'ensemble du site public.
- **Données :** pattern *store* triple-fallback (Supabase → fichier local → mémoire) bien pensé pour Vercel readonly. Source de vérité = `data/*.json` en dev, PostgREST en prod si env vars présentes.
- **Auth :** session HMAC signée (`lib/auth.ts`) + garde par route (`lib/require-admin.ts`) + middleware edge (check existence cookie uniquement). Brute-force lockout en mémoire.
- **Pipeline lead public :** `POST /api/devis` → honeypot → Zod → store → email Resend (asynchrone). Solide.
- **Intégrations :** Resend (email), Supabase (DB+storage), OpenStreetMap (cartes), Groq (assistant IA admin), Web Push.

### Constats

- 🟡 **Densité fonctionnelle disproportionnée pour une vitrine artisan** — ~90 pages admin (CRM, ERP, RGPD, A/B testing, forecasting, carbon footprint…). Surface de maintenance énorme. À cadrer : périmètre réellement utilisé vs démo.
- 🟡 **Deux systèmes de réservation parallèles** — `components/inline-booking.tsx` (créneaux générés client) et `app/rendez-vous` (fetch API). Incohérence produit.

---

## 2. Pages existantes

- **156 pages** (`page.tsx`) au total · **~65 publiques** · **~90 admin**.
- **Pages publiques** : home, 6 pages service cœur (`/chauffage`, `/pompes-a-chaleur`, `/climatisation`, `/sanitaire`, `/entretien`, `/energies-renouvelables`), 9 landings SEO-LU (`/chauffage-luxembourg`…), hub + fiches marques + 36 comparateurs, 8 outils, zones + communes, actualités + articles, pages légales, recrutement, contact, devis, espaces client à référence.
- 🟡 **Route fantôme** `/outils/autoconsommation-pv` — référencée (tracking de tâches) mais inexistante → **404**. Le composant `components/pv-autoconsumption-calculator.tsx` existe mais est monté sur `app/energies-renouvelables/page.tsx:86`. *(Confirmé par `AUDIT-2026-06-04.md:110`.)*
- ✅ Tous les liens de `components/nav.tsx` pointent vers des routes existantes — aucun lien cassé.

---

## 3. SEO technique

### Points forts
✅ `app/sitemap.ts`, `app/robots.ts` (disallow `/admin` + `/api/admin`), `app/manifest.ts`, `opengraph-image.tsx`, icônes générées.
✅ JSON-LD riche et varié : Organization/HVACBusiness (`lib/company-info.ts:115`), Service, LocalBusiness+Breadcrumb, Product, FAQPage, Article, AggregateRating/Review, DefinedTermSet.
✅ Helpers SEO bien conçus (`buildSeoMetadata`, `buildAlternates`) gérant le piège Next du remplacement du bloc `alternates`.

### Constats

- 🔴 **Canonical hérité `/` sur les pages service cœur.** `app/chauffage/page.tsx:7-11` (et `pompes-a-chaleur`, `climatisation`, `sanitaire`, `entretien`, `energies-renouvelables`) n'exportent que `title`+`description`, **sans bloc `alternates`**. Elles héritent donc de `alternates.canonical: "/"` du root layout (`app/layout.tsx:66`). **Résultat : ces pages déclarent la home comme URL canonique** → signal de duplication, risque de désindexation au profit de `/`. *(Vérifié manuellement.)*

- 🔴 **Hreflang multilingue factice.** Le layout déclare `fr-LU`/`de-LU`/`en-LU`/`x-default` (`app/layout.tsx:65-72`) et `lib/seo-alternates.ts:18-25` les génère, mais **toutes les variantes pointent vers la même URL FR**. Le site n'a pas d'URLs localisées (switch par cookie runtime, `<html lang="fr">`). Google considère ces annotations comme erronées (return-tags manquants / contenu non traduit). → Retirer `de`/`en` tant que le contenu n'est pas traduit par URL, ou créer de vraies routes localisées.

- 🟠 **~16 pages publiques sans metadata unique.** Les Client Components ne peuvent pas exporter `metadata` ; faute de `layout.tsx` dédié, ils retombent sur le titre/description par défaut du layout : `app/contact`, `app/depannage`, `app/a-propos`, `app/realisations`, `app/recrutement(/candidature)`, `app/rendez-vous`, `app/calculateur-deperditions`, et les 8 `app/outils/*`. → Titres/descriptions non uniques (mauvais SERP). Pattern de correction déjà existant (`cookies`, `savoir-faire` ont un `layout.tsx`).

- 🟠 **Pages indexables absentes du sitemap.** `/temoignages` (porte pourtant AggregateRating), `/ressources`, `/zones` + communes (fort potentiel géo-local), `/calculateur-deperditions`, `/rendez-vous`, `/api-docs` (`app/sitemap.ts:11-54`, liste manuelle qui dérive du contenu réel).

- 🟡 `manifest` sans icônes 192/512 (`app/manifest.ts:30-45`) → installabilité PWA dégradée.
- 🟡 `lastModified = new Date()` pour toutes les routes (`app/sitemap.ts`) → signal de fraîcheur dilué.
- 🟡 Pas de `BreadcrumbList` ni dates Article sur `actualites/[slug]` ; pages service sans OG/twitter propres.
- 🟡 `noindex` manquant sur routes transactionnelles `[id]` : `paiement-demo/[id]`, `parrainage/[reference]`, `feedback/[id]`, `equipement/[id]`.

---

## 4. Performance

### Points forts
✅ Hero LCP optimal : `next/image` + `priority` + `fetchPriority="high"` + `sizes` + `quality=82` (`components/home/hero.tsx:112-121`).
✅ `next.config.mjs` images AVIF/WebP, cache 30 j, deviceSizes/imageSizes, preconnect unsplash/pexels.
✅ `lenis` chargé en `import()` dynamique, desktop ≥1024px non-tactile uniquement (`components/smooth-scroll.tsx:23`).
✅ `xlsx` (~400 ko) importé **serveur uniquement** (`lib/catalogue-parser.ts`) — jamais dans un bundle client.
✅ Service worker soigné (`public/sw.js`) : network-first HTML, SWR pour JS/CSS, cache-first images, passthrough `/api` et `/admin`.

### Constats

- 🔴 **Home 100 % client-rendered.** `app/page.tsx` est un Server Component mais ses **13 sections** (`components/home/*.tsx`) sont **toutes `"use client"`** sans nécessité technique (contenu statique animé). Au total **~198 fichiers `"use client"`** sous `app/` + `components/`.

- 🔴 **framer-motion sur le chemin critique.** **42 fichiers** l'importent, dont `components/ui.tsx:4` (module UI partagé `"use client"`) et le hero LCP. framer-motion (~40-110 ko gzip) est donc tiré dans presque toutes les pages publiques. **C'est le plus gros levier JS du site.** → CSS keyframes pour les animations d'entrée simples, ou `LazyMotion`+`m`.

- 🟠 **Aucun `next/dynamic` dans tout le code.** Les widgets lourds sont importés statiquement et montés en dur : `command-palette` (499 l.), `chat-widget` (polling 5 s), calculateurs, `luxembourg-map`. → Lazy-load `ssr:false`.

- 🟠 **`I18nProvider` enveloppe tout l'arbre** (`app/layout.tsx:119`) → force le contexte client partout.

- 🟠 **Inter Tight : 4 graisses toutes préchargées** (`app/layout.tsx:33-39`) + Fraunces variable = jusqu'à 5 préchargements bloquants. → Réduire aux graisses above-the-fold (400/700).

- 🟡 `lighthouse-reports/` **vide** — aucun baseline mesuré (la mesure dure reste à produire).

---

## 5. Erreurs de code

> ⚠️ `next.config.mjs:84,87` active `typescript.ignoreBuildErrors:true` **et** `eslint.ignoreDuringBuilds:true`. **Le build passe au vert en masquant 53 erreurs**, dont plusieurs bugs fonctionnels réels, eux-mêmes avalés par 96 `catch {}` vides. C'est le **risque systémique #1** du projet.

| Métrique | Valeur |
|---|---|
| Erreurs `tsc --noEmit` | **53** |
| ESLint | **non configuré** |
| `console.log` en prod | 1 (légitime, `lib/logger.ts:43`) |
| `as any` | 6 |
| `catch {}` vides | **96** |
| `@ts-ignore` / TODO / FIXME | 0 |

### Causes racines (regroupées)

- 🔴 **Bugs fonctionnels réels masqués** (par les flags build + `catch {}`) :
  - `app/admin/dashboard/page.tsx:166` — filtre « dormants » teste `status === "contact"` ; la valeur canonique est `contacte` → **le filtre rate tous les leads contactés** (TS2367, branche morte).
  - `app/api/admin/sidebar-badges/route.ts:40` — `findDuplicates` n'existe pas (exports réels : `findDuplicatesFor`, `findAllDuplicateGroups`) → **badge doublons jamais affiché**, avalé par `catch {}` (TS2339).
  - `app/api/admin/sidebar-badges/route.ts:69` — filtre sur `fireAt`/`status` alors que `Reminder` expose `firedAt`/`dueAt`/`dismissedAt` → **compteur rappels toujours faux** (TS2769).
  - `lib/email-assistant.ts:106,382` — accès `.service` (singulier) alors que le champ est `services` (array) → **contenu d'email incorrect/vide** (TS2551).
  - `app/admin/leads/[reference]/quote/page.tsx:249,280` — `prev` possiblement `null` → **risque de crash runtime** (TS18047).

- 🔴 **Dérive enum budget V1/V2 (~14 erreurs).** `lib/devis-schema.ts:25-37` a élargi `BudgetEnum` (V2 : `10-25/25-50/50-100/100plus`) sans propager aux consommateurs (V1 : `10-20/20-40/40plus`) → maps de labels incomplètes : `lib/webhook.ts:29`, `lib/pipeline-value.ts:39`, `lib/demo-seed.ts:279`, `app/admin/leads/[reference]/page.tsx:410`, `app/devis/recap/[reference]/page.tsx:143`, `app/espace/[reference]/page.tsx:354`.

- 🔴 **Zod v4 — `z.record()` à 1 argument (5 erreurs + cascade).** Le projet est sur `zod@4.4.3` où `z.record()` exige 2 args (key + value). Forme v3 utilisée : `app/api/analytics/route.ts:26`, `app/api/admin/backup/route.ts:38`, `lib/experiments-store.ts:28,42,43` → cascade de 6 TS7015 + TS7053 + TS2322.

- 🟠 `preferredBrand` manquant dans le mapping leads : `lib/leads-store.ts:200,302` (TS2741) + corollaires (`app/api/booking/route.ts:89`, `lib/demo-seed.ts:404,411`).

- 🟠 **Tests E2E cassés** — `@playwright/test` absent (9 erreurs TS2307/TS7031/TS7006). Cf. §7.

- 🟡 `as any` ×6 (`lib/leads-store.ts:448,461,500`, `app/api/devis/route.ts:137`, `lib/email.ts:117`, `app/admin/automations/page.tsx:472`).
- 🟡 Warning Tailwind `[--accent:theme(colors.copper)]` (`app/admin/dashboard/page.tsx:527-530`).
- 🟡 Prérendu `app/icon.tsx`/`app/apple-icon.tsx` fragile (`@vercel/og` + chemin avec espaces « TEST CLAUDE CODE ») — échec **local Windows** uniquement, OK en prod Vercel.

---

## 6. Composants inutilisés

✅ Codebase propre : sur 89 composants, **3 morts confirmés** (0 import entrant) ; sur 141 modules `lib`, **0 orphelin** (les 2 candidats sont importés dynamiquement / via webpack).

- 🟡 **Composants morts supprimables :**
  - `components/admin/admin-menu.tsx` (doublon probable de `admin-sidebar.tsx`)
  - `components/admin/push-register.tsx`
  - `components/admin/sentiment-badge.tsx`
- ✅ Faux positifs écartés : `lib/automations-executor.ts` (import dynamique `delayed-actions-store.ts:77`), `lib/empty-module.js` (alias webpack `next.config.mjs:7`).

---

## 7. Dépendances inutiles

✅ **0 dépendance runtime inutilisée** — `lenis` (import bare dynamique), `xlsx` (serveur), `framer-motion`, `clsx`, `tailwind-merge`, `zod`, `lucide-react` tous bien utilisés.

- 🟠 **Dépendance manquante (phantom) : `@playwright/test`.** Importé par `tests/e2e/smoke.spec.ts:1` et `playwright.config.ts:1`, invoqué par `.github/workflows/ci.yml:43`, mais **absent de `package.json`** → **CI / tests E2E cassés**.

---

## 8. Sécurité

> ✅ Couverture auth globale excellente : **154/157 routes admin** appellent correctement `requireAdminApi` avec `if (!auth.ok) return auth.response`. Headers OWALSP complets (HSTS+preload, COOP/CORP, `frame-ancestors 'none'`, Permissions-Policy 30+ features, `X-Robots-Tag noindex` sur `/api/admin/*`). Cookie session `httpOnly`+`secure`(prod)+`sameSite:lax`. `timingSafeEqual` partout. Routes publiques POST validées Zod + honeypot + rate-limit.

### Constats

- 🔴 **Bypass d'authentification — 2 routes diagnostic.** `app/api/admin/diagnostic/route.ts:29` et `app/api/admin/diagnostic/send-test/route.ts:17` utilisent `if (auth instanceof Response) return auth;`. Or `requireAdminApi` retourne **toujours un objet plain** `{ ok, response, session }`, **jamais une `Response`** → la condition est **toujours fausse**, l'early-return ne se déclenche jamais. Le middleware ne vérifie que l'**existence** du cookie (`middleware.ts:23`) → **n'importe quel cookie `ca-admin-session` forgé** atteint ces handlers sans vérification HMAC. *(Vérifié manuellement.)* Impact :
  - `GET /diagnostic` → **fuite des secrets** (valeurs partielles masquées de `SESSION_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `ADMIN_PASSWORD` — `route.ts:55`) + sondes de connectivité.
  - `POST /diagnostic/send-test` → **envoi d'emails arbitraires** via le compte Resend du client depuis son domaine vérifié (spoofing de marque).
  - **Aurait été détecté à la compilation** si `ignoreBuildErrors` n'était pas activé (cf. §5).

- 🟠 **Secrets de démo faibles + `.gitignore` partiel.** `.env.local` : `ADMIN_PASSWORD=demo2026`, `SESSION_SECRET=dev-only-...` → à rotationner avant prod. `.gitignore` ignore `.env.local` mais **pas tout `data/`** (seulement `leads.json` + `photos/`) → `data/2fa-secret.txt`, `chat-conversations.json` etc. seraient commités. *(Projet pas encore un dépôt git.)*

- 🟠 **Open redirect.** `app/api/email-track/c/[id]/route.ts:16-32` redirige (302) vers tout `?u=` http(s) sans allowlist de domaine → phishing abusant le domaine de confiance.

- 🟠 **IDOR fuite PII chat.** `app/api/chat/[id]/messages/route.ts:26-44` (GET) **sans token ni auth** → toute personne avec un `id` lit la conversation complète (`visitorName`/`visitorEmail`). IDs faibles : `conv-${Date.now()}-${randomBytes(3)}` = 24 bits d'aléa + préfixe temporel prédictible → énumérable.

- 🟠 **Rate-limit / brute-force par instance.** `lib/rate-limit.ts` et le lockout de `lib/auth.ts` sont des `Map` en mémoire → sur serverless Vercel, réinitialisés au cold-start, contournables en répartissant la charge. `clientKey` fait confiance au premier `x-forwarded-for` sans validation (spoofable). Migration Upstash Redis documentée.

- 🟡 `paiement-demo/[id]` non authentifié expose `leadReference`+montant (IDOR-by-obscurity).
- 🟡 Sous-domaine Supabase en clair (`app/layout.tsx:100`, dns-prefetch) — info disclosure.
- 🟡 Markdown/HTML admin non sanitizé (`app/admin/kb/page.tsx:395`, `app/admin/me/signature/page.tsx:224`) — stored-XSS en multi-rôle.
- 🟡 CSP `script-src 'unsafe-inline'` (`next.config.mjs:14`) — affaiblit la protection XSS (largement imposé par Next ; fix robuste = CSP à nonce).
- 🟡 Sessions HMAC sans liste de révocation — logout n'invalide pas un token volé avant `exp` (12 h).

---

## 9. Accessibilité (WCAG 2.1 AA)

> ✅ Points positifs : skip-link conforme (`app/layout.tsx:113`), landmarks `nav`/`main`/`footer`, `alt=""` correct sur images décoratives, formulaire candidature exemplaire (`htmlFor`/`id`), reset CSS `prefers-reduced-motion` (`globals.css:64-71`), la plupart des boutons-icône ont un `aria-label`.

### Constats

- 🔴 **Inputs sans label associé sur les 3 formulaires majeurs.** Les helpers `Field` rendent un `<div>`/`<label>` sans `htmlFor`, inputs sans `id`/`aria-label` → lecteur d'écran annonce « zone de texte » sans intitulé.
  - `app/contact/page.tsx:236-249` (+ select objet `:87`, textarea `:101`)
  - `components/devis/configurator.tsx:1640-1655` (`Label` est un `<div>` `:1512`)
  - `app/rendez-vous/page.tsx:424-438`

- 🔴 **Modales sans focus trap ni retour de focus.** Aucune superposition ne piège le focus ni ne le restaure : `command-palette.tsx:283` (Échap OK mais Tab s'échappe), `chat-widget.tsx:166` (pas d'`aria-modal`, pas d'Échap), `nav.tsx:152` (menu mobile, pas d'Échap), `cookie-consent.tsx:58` (pas d'Échap), `whatsapp-cta.tsx:62`.

- 🟠 **Aucun style `focus-visible`** dans `components/` — `focus:outline-none` (42 occ.) souvent remplacé seulement par un changement de bordure (contact, newsletter, chat, command-palette) → navigation clavier illisible (WCAG 2.4.7).

- 🟠 **Erreurs non reliées aux champs** (`aria-describedby` absent) et **aucun `role="alert"`/`aria-live`** → échecs silencieux pour lecteurs d'écran (`configurator:467`, `rendez-vous:348`, `newsletter-signup:104`).

- 🟠 **Contrastes sous AA.** `text-muted` (#8B847A) ≈ **2.9:1** sur cream (massivement utilisé pour petit texte) ; `copper` (#B86A36) ≈ **3.4:1** (eyebrows mono 10-11px) ; `ember` sur CTA « Appel » mobile ≈ 3.3:1. AA exige 4.5:1 (petit texte). `tailwind.config.ts:12-37`.

- 🟠 **framer-motion ignore `prefers-reduced-motion`** — 0 `useReducedMotion`/`MotionConfig`. Le reset CSS ne touche pas les transforms pilotés en JS (hero, configurateur, cookie-consent, chat).

- 🟠 `aria-current` absent sur la nav active (état purement visuel, `nav.tsx:107`).
- 🟠 `<html lang="fr">` figé au SSR ; la locale réelle (cookie) n'est appliquée qu'après hydratation (`i18n-provider.tsx:44`) → mauvaise prononciation au premier paint pour DE/EN.
- 🟠 Bouton d'envoi du chat sans nom accessible (`chat-widget.tsx:263`, icône seule).
- 🟡 Language switcher : backdrop `<button aria-hidden>` focusable ; `aria-label` en anglais ; pas d'`aria-current` sur la langue active.

---

## 10. Cohérence UX/UI

> ✅ Kit partagé `components/ui.tsx` (`Button`, `Eyebrow`, `SectionTitle`, `Reveal`, `PageHeader`) ; états loading/empty/error bien couverts sur configurateur, rendez-vous, newsletter.

### Constats

- 🟠 **Surcharge & collision des CTA flottants mobile.** Montés ensemble (`app/layout.tsx:131-133`), coexistent jusqu'à **5 incitations concurrentes** : sticky Devis + sticky Appel + WhatsApp FAB + Chat FAB + CTA contenu.
  - **Collision :** le popover WhatsApp (`whatsapp-cta.tsx:64`, `bottom-24 right-5`, `z-[55]`) occupe **exactement** l'ancre du bouton Chat (`chat-widget.tsx:155`, même position, même z-index) → conflit de clics.
  - La barre sticky (`bottom-0`, `z-30`) passe **sous** les FABs (`z-55`) → la zone « Appel » peut être masquée sur petits écrans.

- 🟡 **`Button` du kit largement contourné** — CTA réécrits à la main avec la même chaîne Tailwind dupliquée (hero, nav, mobile-sticky, newsletter, configurateur) → drift de paddings (`py-2.5`/`py-3`/`py-3.5`/`py-4`).
- 🟡 **4 helpers `Field` distincts incompatibles** (contact, configurateur, rendez-vous, candidature) → c'est précisément ce qui a fait diverger l'accessibilité (§9).
- 🟡 Vert succès en hexa magique `#22a06b` répété hors palette ; WhatsApp et Chat partagent l'icône `MessageCircle` (ambiguïté) ; gestion d'erreur réseau du chat silencieuse (`catch {}` `:117`) ; double système de booking (§1).

---

## Annexe — Méthodologie

Analyse en lecture seule via 6 agents spécialisés (SEO, perf, correctness, dead-code/deps, sécurité, a11y/UX) + vérifications manuelles ciblées sur les 2 constats critiques (bypass auth, canonical). Erreurs `tsc` mesurées via `npx tsc --noEmit`. Aucun fichier du projet n'a été modifié — seuls `AUDIT.md`, `QUICK_WINS.md`, `ROADMAP.md` ont été créés, comme demandé.

**Prochaine étape :** valider cet audit, puis dérouler `QUICK_WINS.md` (corrections rapides à fort impact) et `ROADMAP.md` (plan phasé).
