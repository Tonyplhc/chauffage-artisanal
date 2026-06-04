# Checklist de mise en production · Chauffage Artisanal

> Document à parcourir **avant** chaque déploiement public.
> Tant qu'une case n'est pas cochée, le site reste en mode démonstration interne.

---

## 1. Sécurité ✅ (acquis) + ⚠ (à compléter)

- ✅ Auth admin par cookie HMAC signé (`lib/auth.ts`)
- ✅ Middleware Next.js bloquant `/admin/*` et `/api/admin/*` sans cookie
- ✅ Brute-force protection : 5 essais → 15 min de cooldown par IP
- ✅ Rate limit `/api/devis` : 6 req/min/IP
- ✅ Honeypot anti-bot
- ✅ Validation Zod stricte côté serveur
- ✅ Sanitization HTML strip sur champ message
- ✅ Security headers via `next.config.mjs` (CSP, X-Frame-Options, HSTS…)
- ✅ Cookies `httpOnly` + `secure` (prod) + `sameSite=lax`
- ⚠ **À faire avant prod** : générer un vrai `SESSION_SECRET` (≥ 32 chars, randomBytes)
- ⚠ **À faire avant prod** : définir un vrai `ADMIN_PASSWORD` fort
- ⚠ **À envisager** : Cloudflare Turnstile / Captcha si volume bot
- ⚠ **À envisager** : multi-utilisateurs admin via NextAuth ou Clerk
- ⚠ **À envisager** : rate-limit multi-instance (Upstash Redis)

## 2. Données & RGPD

- ✅ Cookie consent banner (3 niveaux) avant pub/analytics
- ✅ Politique de confidentialité (`/confidentialite`)
- ✅ Politique cookies (`/cookies`)
- ✅ Mentions légales (`/mentions-legales`)
- ✅ Schéma Supabase prêt (`supabase/migrations/*.sql`)
- ✅ Durées de conservation documentées
- ⚠ **À compléter** : identité légale réelle dans `/mentions-legales`
- ⚠ **À compléter** : route `DELETE /api/admin/leads/[ref]` pour droit à l'oubli RGPD
- ⚠ **À compléter** : route d'export RGPD (`GET /api/admin/leads/[ref]/export.json`)
- ⚠ **À configurer** : Supabase point-in-time recovery (backup auto)

## 3. Infrastructure

- ✅ Adapter pattern dev/prod transparent
- ✅ Variables d'environnement documentées (`.env.example`)
- ✅ Logger structuré JSON
- ✅ Sentry adapter (fetch direct, sans SDK)
- ⚠ **Avant prod** : créer projet Supabase + exécuter migration SQL
- ⚠ **Avant prod** : créer bucket Storage `leads-photos` (privé)
- ⚠ **Avant prod** : créer compte Resend + vérifier domaine
- ⚠ **Avant prod** : créer projet Sentry + récupérer DSN
- ⚠ **Avant prod** : variables Vercel : `SESSION_SECRET`, `ADMIN_PASSWORD`,
  `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_ADMIN`, `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, `SENTRY_DSN`, `PUBLIC_URL`

## 4. Vérification de véracité du contenu

- ✅ `content-truth-audit.md` listant chaque affirmation 🟢/🟡/🔴
- ✅ Affirmations 🔴 retirées ou neutralisées
- ⚠ **À recueillir auprès du client** :
  - Année de fondation exacte
  - Identité légale complète (RCS, TVA, adresse)
  - Numéro de téléphone professionnel
  - Email professionnel
  - Politique d'astreinte réelle
  - Politique de visite/devis (gratuite ? délai engagé ?)
  - Certifications réellement détenues
  - Partenariats officiels avec fabricants (si existants)
  - Avis Google réel (note, nombre)
  - 2-3 projets réels avec autorisation client pour publication

## 5. Performance & Lighthouse

- ✅ `next/font` Google Fonts auto-hébergées + display swap
- ✅ Préconnexions DNS aux CDN images (Unsplash, Pexels)
- ✅ Next/Image avec AVIF + WebP, sizes adaptées
- ✅ Cache `public, max-age=31536000, immutable` sur assets statiques
- ✅ Lenis smooth-scroll **désactivé** sur tactile, reduced-motion, et < 1024px
- ✅ `inputMode` + `autoComplete` sur tous les champs formulaire
- ✅ `loading="lazy"` automatique sur Next/Image hors viewport
- ⚠ **À mesurer** : Lighthouse mobile (cible ≥ 90 perf / 100 a11y / 100 SEO / 100 best)
- ⚠ **À auditer** : LCP image (hero) — taille en kB après optimisation
- ⚠ **À auditer** : CLS sur hero + grille services (réservations d'espace)

## 6. Tests mobile réels

Devices à tester physiquement, **pas en émulation devtools** :

- [ ] iPhone Safari (iOS 16+) — chargement, scroll, upload photo, clavier
- [ ] Android Chrome — idem
- [ ] iPhone Safari mode lecture inversée (reduced-motion)
- [ ] Tablette iPad — layout adaptatif
- [ ] Connexion 3G/4G simulée (devtools throttling pour debug)

Points à vérifier en mobile :
- [ ] Touch targets ≥ 44 px sur tous les boutons
- [ ] Upload photo : Safari ouvre bien le picker (caméra/galerie)
- [ ] Clavier ne casse pas la mise en page (configurateur)
- [ ] Cookie banner ne bloque pas le CTA principal
- [ ] Pas de scroll horizontal nulle part

## 7. SEO & métadonnées

- ✅ `metadata` configuré sur chaque page
- ✅ Open Graph par défaut
- ✅ `robots: false` sur `/admin/*` et routes `/api/admin/*`
- ⚠ **À ajouter** : `sitemap.xml` (Next.js `app/sitemap.ts`)
- ⚠ **À ajouter** : `robots.txt` (Next.js `app/robots.ts`)
- ⚠ **À ajouter** : favicon + apple-touch-icon
- ⚠ **À ajouter** : Open Graph image partage social
- ⚠ **À ajouter** : Schema.org `LocalBusiness` JSON-LD
- ⚠ **À configurer** : Google Search Console + Bing Webmaster

## 8. Email transactionnel

- ✅ Templates HTML stylés (`lib/email.ts`)
- ✅ Version texte plain pour clients sans HTML
- ⚠ **Avant prod** : vérifier le domaine `chauffage-artisanal.lu` dans Resend
- ⚠ **Avant prod** : configurer SPF + DKIM + DMARC sur le DNS
- ⚠ **Avant prod** : préchauffer le domaine d'envoi (envoyer progressivement)

## 9. Monitoring & alertes

- ✅ Logger JSON structuré sur tous les events critiques
- ✅ Sentry-compatible (DSN env var)
- ⚠ **À configurer** : alertes Sentry sur events > seuil
- ⚠ **À configurer** : healthcheck `/api/health` ping monitoring (UptimeRobot, etc.)
- ⚠ **À configurer** : alerte si > X échecs login admin / heure

## 10. Continuité & sauvegarde

- ⚠ **Backup Supabase** : Point-in-time recovery (PITR) à activer
- ⚠ **Exports périodiques** : script CRON qui dump leads.csv vers S3 / Drive
- ⚠ **Doc d'incident** : qui appeler si site down un dimanche soir
- ⚠ **Documentation interne** : ce fichier + README-pipeline + content-truth-audit

---

## Étapes de déploiement Vercel

1. Connecter le repo Git
2. Variables d'environnement (toutes les clés ci-dessus)
3. Domaine `chauffage-artisanal.lu` → A/CNAME vers Vercel
4. SSL auto-géré par Vercel
5. Configurer build : `next build` (commande par défaut)
6. Première soumission `/devis` → vérifier réception email admin + client + apparition dashboard
7. Tester depuis 2-3 IPs différents (collègue, mobile 4G) — confirmer rate-limit non déclenché par hasard
8. Activer Sentry alerts
9. Soumettre sitemap à Google Search Console
10. **Annoncer le lancement** uniquement quand toutes les cases sont cochées.
