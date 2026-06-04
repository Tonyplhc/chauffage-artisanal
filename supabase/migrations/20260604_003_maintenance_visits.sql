-- =====================================================================
-- Chauffage Artisanal · Table maintenance_visits (interventions terrain)
-- À exécuter dans le SQL editor du projet Supabase.
-- Idempotent : peut être ré-exécuté sans dommage.
-- =====================================================================
--
-- Couvre :
--   - les visites d'entretien sous contrat (W23.1 / W24.2)
--   - les interventions ad-hoc créées depuis /admin/visits (dépannage,
--     pose, diagnostic) — `contract_id` est alors NULL.
--   - le compte-rendu structuré : checklist, mesures, pièces, notes
--     horodatées, signature client (data-URL PNG en JSONB).
-- =====================================================================

create table if not exists public.maintenance_visits (
  id                 text primary key,
  contract_id        text,
  lead_reference     text not null,
  equipment_id       text,

  -- Type métier — élargi vs v1 où tout était sous contrat
  type               text not null
                     check (type in ('entretien','depannage','pose','diagnostic')),

  visited_at         timestamptz not null,
  technician_email   text,
  duration_min       int,

  -- Compte-rendu structuré (tous JSONB pour flexibilité du schéma)
  checklist          jsonb not null default '[]',
  measurements       jsonb not null default '[]',
  parts_replaced     jsonb not null default '[]',
  recommendations    text,
  observations       text,

  -- Notes terrain horodatées (journal chronologique)
  intervention_notes jsonb default '[]',

  -- Signature client — { dataUrl, signerName, signedAt }
  -- dataUrl = "data:image/png;base64,..." (~5-100 KB typique)
  client_signature   jsonb,

  -- Cycle de vie
  status             text not null default 'draft'
                     check (status in ('draft','finalized')),
  finalized_at       timestamptz,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists maintenance_visits_lead_idx
  on public.maintenance_visits (lead_reference);

create index if not exists maintenance_visits_contract_idx
  on public.maintenance_visits (contract_id)
  where contract_id is not null;

create index if not exists maintenance_visits_visited_idx
  on public.maintenance_visits (visited_at desc);

create index if not exists maintenance_visits_status_idx
  on public.maintenance_visits (status);

create index if not exists maintenance_visits_tech_idx
  on public.maintenance_visits (technician_email)
  where technician_email is not null;

-- Trigger updated_at (réutilise la fonction de la migration 001)
drop trigger if exists trg_maintenance_visits_updated
  on public.maintenance_visits;
create trigger trg_maintenance_visits_updated
  before update on public.maintenance_visits
  for each row execute procedure public.tg_set_updated_at();

-- =====================================================================
-- Notes opérationnelles :
--
-- 1. La taille de client_signature.dataUrl est plafonnée côté API à
--    ~150 KB (validation dans lib/maintenance-visits-store.ts). Pour des
--    signatures plus larges ou un volume très élevé, déplacer vers
--    Supabase Storage (bucket maintenance-signatures) et stocker juste
--    l'URL ici. Pour l'instant : JSONB suffit.
--
-- 2. Pas de FK vers leads(reference) volontairement : un lead peut être
--    purgé (RGPD) sans casser l'historique des interventions.
--
-- 3. RLS désactivé : l'API admin tape avec SUPABASE_SERVICE_ROLE_KEY
--    qui bypass RLS. Si on expose un jour côté client public, ajouter
--    enable row level security; et créer les policies.
-- =====================================================================
