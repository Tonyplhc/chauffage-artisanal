-- =====================================================================
-- Chauffage Artisanal · Schéma initial Supabase
-- À exécuter dans le SQL editor du projet Supabase.
-- Idempotent : peut être ré-exécuté sans dommage.
-- =====================================================================

-- 1. Table principale --------------------------------------------------
create table if not exists public.leads (
  reference          text primary key,
  submitted_at       timestamptz not null default now(),
  status             text not null default 'nouveau'
                     check (status in ('nouveau','contacte','devis_envoye','converti','perdu')),

  -- Projet
  service            text not null
                     check (service in ('chauffage','pac','clim','sanitaire','enr','depannage','autre')),
  building_type      text not null
                     check (building_type in ('maison','appartement','collectif','tertiaire','autre')),
  construction       text not null check (construction in ('neuf','renovation')),
  surface            int  not null check (surface between 10 and 20000),
  current_energy     text not null
                     check (current_energy in ('fioul','gaz','electrique','bois','pac','autre','inconnu')),
  commune            text not null,
  timeline           text not null check (timeline in ('urgent','court','annee','exploration')),
  budget             text not null check (budget in ('less10','10-20','20-40','40plus','inconnu')),

  -- Contact
  full_name          text not null,
  email              text not null,
  phone              text not null,
  preferred_channel  text not null check (preferred_channel in ('phone','email','sms','whatsapp')),
  message            text default '',
  rgpd_consent       boolean not null,

  -- Médias & meta
  photo_urls         text[] not null default '{}',
  metadata           jsonb  not null default '{}',
  source             text   not null default '/devis',
  notes              text   not null default '',

  updated_at         timestamptz not null default now()
);

create index if not exists leads_status_idx     on public.leads (status);
create index if not exists leads_submitted_idx  on public.leads (submitted_at desc);
create index if not exists leads_email_idx      on public.leads (email);

-- 2. Trigger updated_at -----------------------------------------------
create or replace function public.tg_set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end $$ language plpgsql;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
before update on public.leads
for each row execute function public.tg_set_updated_at();

-- 3. Row Level Security ------------------------------------------------
alter table public.leads enable row level security;

-- Aucune policy ouverte. L'API serveur utilise SERVICE_ROLE_KEY (bypass RLS).
-- Le client final n'accède jamais à cette table directement.

-- 4. Storage bucket ----------------------------------------------------
-- À exécuter via SQL ou via l'interface Storage de Supabase :
--
--   insert into storage.buckets (id, name, public)
--   values ('leads-photos', 'leads-photos', false)
--   on conflict (id) do nothing;
--
-- Le bucket DOIT être privé. Les photos sont servies via API signée.

-- 5. Vue agrégée pour dashboard (optionnel) ----------------------------
create or replace view public.leads_summary as
select
  status,
  count(*) as count,
  count(*) filter (where submitted_at > now() - interval '7 days') as last_7_days,
  count(*) filter (where submitted_at > now() - interval '30 days') as last_30_days
from public.leads
group by status;
