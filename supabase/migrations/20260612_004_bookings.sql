-- =====================================================================
-- Migration 004 — Réservations de visites techniques (RDV publics)
-- À exécuter dans le SQL editor du projet Supabase. Idempotente.
--
-- Nécessaire en production : lib/booking-store.ts bascule automatiquement
-- sur Supabase quand SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY sont définis
-- (le filesystem Vercel est éphémère — les RDV doivent vivre en base).
-- =====================================================================

create table if not exists public.bookings (
  id           text primary key,
  -- ISO 8601 conservé en texte : sémantique d'égalité stricte avec le code
  -- (le créneau est une clé d'unicité, pas une donnée à requêter par plage).
  slot_iso     text not null,
  duration_min int  not null default 45,
  purpose      text not null
               check (purpose in ('visite-technique','entretien','depannage','autre')),
  full_name    text not null,
  email        text not null,
  phone        text not null,
  commune      text,
  notes        text,
  created_at   timestamptz not null default now(),
  status       text not null default 'confirmed'
               check (status in ('pending','confirmed','cancelled'))
);

-- Anti-doublon ATOMIQUE : un seul booking non-annulé par créneau.
-- (Remplace le check applicatif lecture-puis-écriture du mode fichier.)
create unique index if not exists bookings_active_slot_uniq
  on public.bookings (slot_iso)
  where status <> 'cancelled';

create index if not exists bookings_created_idx
  on public.bookings (created_at desc);

-- RLS activé : seul le service-role (API serveur) accède à la table.
alter table public.bookings enable row level security;
