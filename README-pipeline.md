# Pipeline commercial · Chauffage Artisanal

## Vue d'ensemble

```
[Visiteur] → /devis (6 étapes) → POST /api/devis
                                  ├─ Zod validation
                                  ├─ Rate limit IP (6/min)
                                  ├─ Honeypot anti-bot
                                  ├─ Sanitize message
                                  ├─ Persist (fs ou Supabase)
                                  ├─ Photos → fichiers ou Supabase Storage
                                  └─ Email Resend (admin + client)
                                          ↓
                                  [/admin/leads]
                                  ├─ Liste filtrable par statut
                                  ├─ Détail dossier (photos, notes)
                                  └─ Transitions statut
```

## Modes de fonctionnement

### Dev (par défaut, hors-ligne)
- **Stockage** : `data/leads.json` + photos dans `data/photos/<reference>/`
- **Emails** : loggés en `console.info`
- **Aucune dépendance externe**, fonctionne immédiatement

### Production
Renseigner `.env.local` avec les clés requises :

```bash
RESEND_API_KEY=re_xxx
EMAIL_FROM=devis@chauffage-artisanal.lu     # domaine vérifié Resend
EMAIL_ADMIN=contact@chauffage-artisanal.lu

SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
```

L'adapter détecte automatiquement les env vars. Aucune modification de code nécessaire.

## Schéma Supabase recommandé

```sql
create table leads (
  reference text primary key,
  submitted_at timestamptz not null default now(),
  status text not null default 'nouveau',
  
  service text not null,
  building_type text not null,
  construction text not null,
  surface int not null,
  current_energy text not null,
  commune text not null,
  timeline text not null,
  budget text not null,
  
  full_name text not null,
  email text not null,
  phone text not null,
  preferred_channel text not null,
  message text default '',
  rgpd_consent boolean not null,
  
  photo_urls text[] default '{}',
  metadata jsonb default '{}',
  source text default '/devis',
  notes text default ''
);

create index on leads (status);
create index on leads (submitted_at desc);

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('leads-photos', 'leads-photos', false);
```

## Endpoints

| Route                                          | Méthode | Description                       |
|------------------------------------------------|---------|-----------------------------------|
| `/api/devis`                                   | POST    | Soumission formulaire             |
| `/api/admin/leads`                             | GET     | Liste tous les leads              |
| `/api/admin/leads/[reference]`                 | GET     | Détail d'un lead                  |
| `/api/admin/leads/[reference]`                 | PATCH   | Update statut ou notes            |
| `/api/admin/leads/[reference]/photo/[index]`   | GET     | Photo binaire                     |

## Sécurité

### À sécuriser avant déploiement public
- [ ] **Auth admin** : `/admin/*` et `/api/admin/*` sont actuellement publics. Implémenter NextAuth, Clerk, ou middleware Basic Auth.
- [ ] **Rate limit prod** : passer le store mémoire vers Upstash Redis pour multi-instance.
- [ ] **CORS** : restreindre `/api/devis` aux origines autorisées si besoin.
- [ ] **Captcha** : ajouter Cloudflare Turnstile sur `/devis` si volume bot.
- [ ] **Backup Supabase** : configurer point-in-time recovery.

### Anti-spam déjà en place
- Honeypot field (`trap`)
- Rate limit 6 req/min/IP
- Zod validation stricte
- Size limit 50 MB body / 8 MB photo
- Photos uniquement formats image

### RGPD
- Consentement explicite obligatoire avant submit
- Cookie consent banner sur tout le site
- Aucune revente, aucune communication tiers
- Suppression sur demande (à implémenter : route `DELETE /api/admin/leads/[reference]`)

## Email automation idées

Templates HTML déjà en place dans `lib/email.ts` :
- **Email admin** : récap complet du lead + lien vers le dossier
- **Email client** : confirmation avec référence + récap projet

À ajouter ultérieurement :
- Relance auto J+3 si statut toujours `nouveau`
- Email "devis envoyé" auto à la transition de statut
- Email "merci pour votre confiance" sur `converti`
