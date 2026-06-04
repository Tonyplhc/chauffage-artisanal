-- ========================================================================
-- Migration 0002 — Recrutement (jobs + candidatures)
-- ========================================================================
-- À appliquer dans le SQL editor Supabase une seule fois.
-- Stockage CV : bucket "candidates-cvs" (à créer manuellement dans Storage).

-- ---------------- Jobs ----------------
create table if not exists public.jobs (
  id            text primary key,
  slug          text unique not null,
  title         text not null,
  contract_type text not null check (contract_type in
                  ('CDI','CDD','interim','alternance','stage','freelance')),
  work_time     text not null check (work_time in ('plein','partiel')),
  salary_min    int,
  salary_max    int,
  description   text not null,
  benefits      text[] not null default '{}',
  published_at  timestamptz not null default now(),
  status        text not null default 'open'
                  check (status in ('open','closed','draft'))
);

create index if not exists jobs_status_idx on public.jobs (status);
create index if not exists jobs_published_at_idx
  on public.jobs (published_at desc);

-- ---------------- Candidates ----------------
create table if not exists public.candidates (
  id          text primary key,
  job_id      text references public.jobs(id) on delete set null,
  first_name  text not null,
  last_name   text not null,
  email       text not null,
  phone       text not null,
  message     text,
  cv_url      text,           -- chemin dans le bucket "candidates-cvs"
  status      text not null default 'new'
                check (status in ('new','reviewed','shortlisted','rejected','hired')),
  created_at  timestamptz not null default now()
);

create index if not exists candidates_job_idx on public.candidates (job_id);
create index if not exists candidates_created_idx
  on public.candidates (created_at desc);

-- ---------------- RLS ----------------
-- L'API serveur passe par la `service_role` key qui bypass RLS. On garde RLS
-- activé pour empêcher tout accès direct depuis un client anon.
alter table public.jobs enable row level security;
alter table public.candidates enable row level security;

-- (Optionnel) policy "lecture publique" si tu veux que le front anon lise
-- directement la table jobs sans passer par l'API serveur :
-- create policy "jobs read open" on public.jobs
--   for select to anon using (status = 'open');

-- ---------------- Storage bucket ----------------
-- À CRÉER MANUELLEMENT dans Supabase Dashboard → Storage :
--   • Name: candidates-cvs
--   • Public: false (CV sensibles, RGPD)
--   • Allowed MIME types: application/pdf
--   • Max file size: 8 MB
