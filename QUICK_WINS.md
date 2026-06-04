# QUICK WINS — Chauffage Artisanal

> Corrections **à fort impact / faible effort**, dérivées de `AUDIT.md`.
> Estimations d'effort : **XS** < 15 min · **S** < 1 h · **M** 1-3 h.
> ⚠️ Aucune de ces corrections n'est appliquée tant que l'audit n'est pas validé.

---

## 🔴 À faire en premier (critique, effort minime)

| # | Action | Fichier(s) | Effort | Impact |
|---|---|---|---|---|
| 1 | **Corriger le bypass auth.** Remplacer `if (auth instanceof Response) return auth;` par `if (!auth.ok) return auth.response;` | `app/api/admin/diagnostic/route.ts:29` · `app/api/admin/diagnostic/send-test/route.ts:17` | XS | Stoppe la fuite de secrets + l'envoi d'emails non authentifié |
| 2 | **Ajouter le canonical sur les 6 pages service.** Ajouter `alternates: { canonical: "/chauffage" }` (etc.) dans chaque `metadata` | `app/chauffage/page.tsx` + 5 services | S | Stoppe la duplication SEO (canonical → home) |
| 3 | **Neutraliser le hreflang factice.** Retirer `de-LU`/`en-LU` des `alternates.languages` tant que le contenu n'est pas traduit par URL | `app/layout.tsx:65-72` · `lib/seo-alternates.ts:18-25` | S | Supprime un signal d'erreur Google |
| 4 | **Élargir `.gitignore` à tout `data/`** + rotationner `ADMIN_PASSWORD`/`SESSION_SECRET` avant prod | `.gitignore` · `.env.local` | XS | Évite de commiter secrets/PII/2FA |
| 5 | **Déclarer `@playwright/test`** en devDependency (`npm i -D @playwright/test`) | `package.json` | XS | Débloque la CI / tests E2E |

---

## 🟠 Gains rapides importants

### SEO

| # | Action | Fichier(s) | Effort |
|---|---|---|---|
| 6 | Ajouter un `layout.tsx` exportant `metadata` unique pour les ~16 pages client sans metadata (`/contact`, `/depannage`, `/a-propos`, `/outils/*`…) | `app/contact/layout.tsx` + autres | M |
| 7 | Compléter le sitemap (`/temoignages`, `/ressources`, `/zones` + communes, `/calculateur-deperditions`, `/rendez-vous`) | `app/sitemap.ts:11-54` | S |
| 8 | Ajouter `noindex` sur les routes transactionnelles `[id]` (`paiement-demo`, `parrainage`, `feedback`, `equipement`) | pages concernées | S |
| 9 | Ajouter les icônes 192/512 au manifest | `app/manifest.ts:30-45` | XS |

### Sécurité

| # | Action | Fichier(s) | Effort |
|---|---|---|---|
| 10 | Fermer l'open redirect (allowlist de domaines sur `?u=`) | `app/api/email-track/c/[id]/route.ts:16` | S |
| 11 | Ajouter un token/HMAC à la lecture des messages chat + augmenter l'entropie des IDs | `app/api/chat/[id]/messages/route.ts:26` · `lib/chat-store.ts:81` | M |
| 12 | Ajouter un token à `paiement-demo/[id]` | `app/api/paiement-demo/[id]/route.ts` | S |

### Accessibilité (gros impact, mécanique)

| # | Action | Fichier(s) | Effort |
|---|---|---|---|
| 13 | Lier `<label htmlFor>` + `id` sur les inputs des 3 formulaires majeurs | `app/contact/page.tsx` · `components/devis/configurator.tsx` · `app/rendez-vous/page.tsx` | M |
| 14 | Ajouter `role="alert"` + `aria-live="polite"` + `aria-describedby` sur les zones d'erreur | mêmes fichiers + `newsletter-signup.tsx` | S |
| 15 | Remplacer `focus:outline-none` nus par `focus-visible:ring-2 focus-visible:ring-copper` (ou un util global dans `globals.css`) | global | S |
| 16 | Ajouter `aria-label="Envoyer"` au bouton d'envoi du chat | `components/chat-widget.tsx:263` | XS |
| 17 | Ajouter `aria-current="page"` sur le lien nav actif | `components/nav.tsx:107` | XS |
| 18 | Wrapper l'app dans `<MotionConfig reducedMotion="user">` (framer-motion respecte `prefers-reduced-motion`) | `app/layout.tsx` | XS |
| 19 | Relever `text-muted` à un ton conforme AA (≥4.5:1 sur cream) ou réserver son usage au gros texte | `tailwind.config.ts` | S |

### Code / build

| # | Action | Fichier(s) | Effort |
|---|---|---|---|
| 20 | Corriger les 2 bugs de filtre admin : `"contact"`→`"contacte"` ; `findDuplicates`→`findDuplicatesFor` ; champs `Reminder` (`fireAt`→`dueAt`) | `app/admin/dashboard/page.tsx:166` · `app/api/admin/sidebar-badges/route.ts:40,69` | S |
| 21 | Corriger `.service`→`.services` dans le générateur d'email | `lib/email-assistant.ts:106,382` | XS |
| 22 | Migrer les `z.record(x)` → `z.record(z.string(), x)` (Zod v4) | `app/api/analytics/route.ts:26` · `app/api/admin/backup/route.ts:38` · `lib/experiments-store.ts:28,42,43` | S |
| 23 | Supprimer les 3 composants morts | `components/admin/{admin-menu,push-register,sentiment-badge}.tsx` | XS |
| 24 | Créer la page `/outils/autoconsommation-pv` (réutilise `pv-autoconsumption-calculator`) **ou** retirer la référence | `app/outils/autoconsommation-pv/` | S |

### Performance

| # | Action | Fichier(s) | Effort |
|---|---|---|---|
| 25 | Réduire les graisses préchargées d'Inter Tight (400/700 préchargées, 500/600 en `preload:false`) | `app/layout.tsx:33-39` | XS |
| 26 | Lazy-load `ssr:false` des widgets non critiques (`CommandPalette`, `ChatWidget`) via `next/dynamic` | `app/layout.tsx` | S |
| 27 | Générer un baseline Lighthouse et le committer dans `lighthouse-reports/` | — | S |

---

## Ordre d'exécution conseillé

1. **Bloc critique (#1-5)** — sécurité + SEO + CI, ~1 h cumulée, zéro régression visuelle.
2. **A11y mécanique (#13-19)** — gros gain WCAG, modifications localisées.
3. **Bugs code (#20-24)** — corrige des fonctionnalités cassées invisibles aujourd'hui.
4. **SEO metadata (#6-9)** + **sécu (#10-12)** + **perf (#25-27)**.

> Les chantiers plus lourds (refonte client→server de la home, focus-trap des modales, CSP à nonce, migration rate-limit Redis, passe complète des 53 erreurs TS) relèvent de `ROADMAP.md`.
