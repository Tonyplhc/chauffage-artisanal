# ROADMAP — Chauffage Artisanal

> Plan d'action phasé issu de `AUDIT.md`. Chaque phase est autonome et livrable indépendamment.
> Priorité = **🔴 Critique** → **🟠 Important** → **🟡 Mineur**.
> ⚠️ Rien n'est exécuté tant que l'audit n'est pas validé.

---

## Phase 0 — Colmatage critique (J+0, ~½ journée)

**Objectif :** fermer les failles exploitables et les fuites SEO. Aucun risque de régression.

- 🔴 **Sécurité — bypass auth.** Corriger les 2 routes diagnostic (`auth.ok`). Auditer qu'aucune autre route n'utilise le pattern `instanceof Response`.
- 🔴 **SEO — canonical.** Ajouter `alternates.canonical` propre aux 6 pages service + vérifier le HTML rendu.
- 🔴 **SEO — hreflang.** Retirer `de-LU`/`en-LU` (factices) en attendant de vraies URLs localisées.
- 🔴 **Secrets.** Élargir `.gitignore` à `data/`, rotationner `ADMIN_PASSWORD`/`SESSION_SECRET`, init git proprement.
- 🟠 **CI.** Ajouter `@playwright/test` à `package.json`.

**Critère de sortie :** secrets non exploitables, pages service canoniques correctes, CI verte.

---

## Phase 1 — Fiabilité du code (J+1 à J+3)

**Objectif :** rendre le build honnête et corriger les bugs fonctionnels masqués.

- 🔴 **Passe TS — les 53 erreurs.** Traiter par lots : (a) dérive enum budget V1/V2 → unifier la source de vérité dans `lib/devis-schema.ts` et compléter toutes les maps ; (b) migration `z.record()` Zod v4 ; (c) `preferredBrand` dans le mapping leads ; (d) le reste (buffers, casts).
- 🔴 **Bugs fonctionnels.** Filtre « dormants » (`contact`→`contacte`), badges sidebar (`findDuplicatesFor`, champs `Reminder`), email assistant (`.services`), null-deref quote editor.
- 🟠 **Désactiver le masquage build.** Une fois `tsc` à 0, passer `typescript.ignoreBuildErrors:false` et `eslint.ignoreDuringBuilds:false`, configurer ESLint, brancher `tsc --noEmit` + lint en CI pour empêcher la régression (c'est ce garde-fou qui aurait attrapé le bypass auth).
- 🟡 **Nettoyage.** Supprimer les 3 composants morts, résoudre la route fantôme `/outils/autoconsommation-pv`, traiter les `as any` et le warning Tailwind.

**Critère de sortie :** `tsc --noEmit` à 0, flags de masquage retirés, CI qui bloque sur erreur TS/lint.

---

## Phase 2 — Accessibilité WCAG 2.1 AA (J+3 à J+6)

**Objectif :** lever les bloqueurs d'accessibilité, conformité légale (Luxembourg/UE).

- 🔴 **Formulaires.** Factoriser **un** composant `Field` partagé accessible (`label htmlFor`+`id`, `aria-required`, `aria-describedby`) et remplacer les 4 helpers divergents → corrige a11y **et** la dette UX en un geste.
- 🔴 **Modales.** Focus trap + retour de focus + Échap sur `command-palette`, `chat-widget`, menu mobile (`nav`), `cookie-consent`, popover WhatsApp (envisager `@radix-ui/react-dialog` ou `focus-trap-react`).
- 🟠 **Focus visible.** Util global `focus-visible:ring` ; bannir `focus:outline-none` nu.
- 🟠 **Erreurs annoncées.** `role="alert"` / `aria-live` sur toutes les zones d'erreur.
- 🟠 **Contrastes.** Réétalonner `text-muted` et l'usage de `copper`/`ember` en petit texte (≥4.5:1).
- 🟠 **Mouvement.** `<MotionConfig reducedMotion="user">` global.
- 🟠 **Divers.** `aria-current` nav, nom accessible bouton chat, `lang` SSR cohérent avec la locale.

**Critère de sortie :** audit axe-core/Lighthouse a11y ≥ 95, navigation clavier complète testée.

---

## Phase 3 — Performance (J+6 à J+10)

**Objectif :** réduire le JS critique et restaurer le rendu serveur.

- 🔴 **Dé-clientiser la home.** Convertir les sections statiques de `components/home/*` en Server Components ; isoler les animations dans de petits wrappers client. Cible : home majoritairement SSR/statique.
- 🔴 **framer-motion.** Sortir `motion` de `components/ui.tsx` (module partagé) ; remplacer les animations d'entrée simples par CSS keyframes ; adopter `LazyMotion`+`m` pour le reste.
- 🟠 **Code-splitting.** `next/dynamic({ ssr:false })` sur `CommandPalette`, `ChatWidget`, calculateurs, cartes.
- 🟠 **Fonts.** Réduire les préchargements Inter Tight.
- 🟠 **Contexte client.** Limiter la portée d'`I18nProvider`.
- 🟡 **Mesure.** Baseline Lighthouse committé, budget perf en CI (LCP/TBT/CLS).

**Critère de sortie :** Lighthouse perf ≥ 90 mesuré, JS de la home réduit, LCP < 2.5 s.

---

## Phase 4 — Durcissement sécurité (J+10 à J+13)

**Objectif :** passer du « solide » au « robuste production ».

- 🟠 **Rate-limit / brute-force partagés** (Upstash Redis) au lieu des `Map` par instance ; cesser de faire confiance au `x-forwarded-for` brut (IP plateforme Vercel).
- 🟠 **Open redirect** fermé (allowlist) ; **IDOR chat** (token + entropie) ; token sur `paiement-demo`.
- 🟡 **CSP à nonce** pour retirer `script-src 'unsafe-inline'`.
- 🟡 **Sanitisation** du markdown/HTML admin (DOMPurify) ; révocation de session (deny-list `jti`).

**Critère de sortie :** rate-limit effectif multi-instance, plus d'IDOR exposant de la PII, CSP sans `unsafe-inline`.

---

## Phase 5 — Cohérence UX/UI & dette structurelle (J+13+)

**Objectif :** unifier le design system et rationaliser le périmètre.

- 🟠 **CTA flottants.** Rationaliser : 1 action primaire flottante mobile, résoudre la collision WhatsApp/Chat (z-index + ancres), différencier les icônes.
- 🟡 **Design system.** Généraliser le `Button` du kit (supprimer les CTA réécrits à la main), centraliser les couleurs sémantiques (succès), unifier le système de booking (1 seul).
- 🟡 **Périmètre admin.** Statuer sur les ~90 pages admin : ce qui est réellement utilisé vs démo → archiver/feature-flag le reste pour réduire la surface de maintenance.
- 🟡 **SEO finition.** `BreadcrumbList` + dates Article, OG par catégorie, `lastModified` réel dans le sitemap.

**Critère de sortie :** design system cohérent, périmètre cadré, finitions SEO posées.

---

## Vue d'ensemble

| Phase | Thème | Priorité dominante | Durée indicative |
|---|---|---|---|
| 0 | Colmatage critique | 🔴 | ½ j |
| 1 | Fiabilité du code | 🔴 | 2-3 j |
| 2 | Accessibilité | 🔴/🟠 | 3 j |
| 3 | Performance | 🔴/🟠 | 4 j |
| 4 | Durcissement sécurité | 🟠 | 3 j |
| 5 | UX/UI & dette | 🟡 | continu |

**Principe directeur :** la Phase 1 (retirer le masquage build + CI qui bloque) est le **levier structurel** — sans elle, chaque correction risque de régresser silencieusement. C'est l'investissement à plus fort rendement après le colmatage de la Phase 0.
