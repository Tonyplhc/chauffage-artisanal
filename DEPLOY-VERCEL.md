# 🚀 Déploiement Vercel — Chauffage Artisanal

> Guide opérationnel : suivre dans l'ordre. Le site fonctionne dès le palier 1 ;
> chaque palier suivant active un canal de plus. Aucun palier ne casse les autres.

---

## Palier 0 — Pré-requis (une fois)

1. Compte [vercel.com](https://vercel.com) relié au repo Git du projet.
2. Compte [supabase.com](https://supabase.com) (gratuit) — projet créé.
3. Dans le **SQL editor** Supabase, exécuter les migrations dans l'ordre
   (idempotentes, copier-coller le contenu de chaque fichier) :
   - `supabase/migrations/20260527_001_init.sql` (leads)
   - `supabase/migrations/0002_jobs_candidates.sql` (recrutement)
   - `supabase/migrations/20260528_002_services_array.sql`
   - `supabase/migrations/20260604_003_maintenance_visits.sql`
   - `supabase/migrations/20260612_004_bookings.sql` (**RDV — nouveau, obligatoire**)

> ⚠️ Sans Supabase, les leads et les RDV ne sont PAS persistés sur Vercel
> (filesystem éphémère). C'est la seule dépendance vraiment bloquante.

---

## Palier 1 — Variables OBLIGATOIRES (le site vit)

Vercel → Project → Settings → Environment Variables (Production) :

| Variable | Valeur | Rôle |
|---|---|---|
| `PUBLIC_URL` | `https://www.chauffage-artisanal.lu` | URLs canoniques, sitemap, emails |
| `SUPABASE_URL` | `https://xxxx.supabase.co` (Settings → API) | Persistance leads + RDV + recrutement |
| `SUPABASE_SERVICE_ROLE_KEY` | clé `service_role` (Settings → API — **secrète**) | Accès serveur à la base |
| `ADMIN_PASSWORD` | mot de passe fort (gestionnaire de mots de passe) | Connexion /admin |
| `SESSION_SECRET` | 64 caractères aléatoires (`openssl rand -hex 32`) | Signature des sessions admin |

**Résultat palier 1** : site complet, estimateur, leads scorés, RDV — tout
fonctionne et persiste. Les emails partent en « mode console » (visibles dans
les logs Vercel, pas envoyés).

---

## Palier 2 — Emails réels (recommandé avant lancement)

Compte [resend.com](https://resend.com) (gratuit jusqu'à 100/jour) + domaine vérifié :

| Variable | Valeur |
|---|---|
| `RESEND_API_KEY` | `re_...` |
| `EMAIL_FROM` | `Chauffage Artisanal <devis@chauffage-artisanal.lu>` (domaine vérifié Resend) |
| `EMAIL_ADMIN` | l'adresse qui reçoit les notifications de leads/RDV |

**Résultat** : confirmation client + notification admin à chaque lead, emails RDV.

---

## Palier 3 — Assistant devis IA (/assistant)

| Variable | Valeur |
|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-...` ([console.anthropic.com](https://console.anthropic.com) → API Keys, crédits requis) |

Sans la clé : la page /assistant affiche proprement « L'assistant arrive très
bientôt » et renvoie vers /estimation — rien ne casse. Coût : ~1-3 c€/conversation.

---

## Palier 4 — Optionnels (activer plus tard, au besoin)

| Variable | Active quoi |
|---|---|
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | bouton WhatsApp public (`352XXXXXXXXX`) |
| `NEXT_PUBLIC_ENABLE_AI=1` + `GROQ_API_KEY` | aides IA côté admin (résumés de leads) |
| `SLACK_WEBHOOK_URL` / `DISCORD_WEBHOOK_URL` | ping équipe à chaque lead |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` | paiement d'acomptes |
| `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` | notifications push admin |
| `SENTRY_DSN` | monitoring d'erreurs |
| `ADMIN_TOTP_SECRET` | 2FA sur /admin |
| `SESSION_TTL_HOURS` | durée de session admin (défaut OK) |

---

## Déployer

1. Push sur la branche principale → Vercel build automatiquement.
   (Le build passe sur Vercel ; l'échec local `/icon` est un problème
   Windows/espaces-dans-le-chemin, pas un problème du code.)
2. Domaine : Vercel → Domains → ajouter `www.chauffage-artisanal.lu`
   (+ redirection apex → www). HTTPS automatique.

---

## ✅ Tests post-déploiement (15 min, dans l'ordre)

- [ ] Home s'ouvre en HTTPS, lanceur hero présent
- [ ] Parcours complet : hero → /estimation → résultat → formulaire → **référence DEV-XXXX reçue**
- [ ] Le lead apparaît dans **Supabase → table `leads`** ET dans /admin
- [ ] Email client + email admin reçus (palier 2)
- [ ] RDV : choisir un créneau sur l'écran de confirmation → ligne dans **Supabase → table `bookings`**
- [ ] Re-réserver le MÊME créneau → refus « Créneau déjà réservé »
- [ ] /assistant : répond (palier 3) ou affiche le repli propre (sans clé)
- [ ] `https://…/sitemap.xml` contient `/estimation` · `robots.txt` bloque `/admin`
- [ ] Test mobile sur un vrai téléphone : hero → estimation → lead
- [ ] Google Search Console : propriété ajoutée + sitemap soumis

---

## Rappels sécurité

- `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY` :
  **jamais** dans le code ni en variable `NEXT_PUBLIC_*`.
- `.env.local` reste local (déjà ignoré par git).
- Rotation : si une clé fuite, la régénérer chez le fournisseur puis la
  remplacer dans Vercel (redéploiement automatique).
