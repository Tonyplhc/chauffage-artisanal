-- =====================================================================
-- Migration : passage `service` (text) → `services` (text[])
-- À exécuter dans le SQL editor Supabase après la migration init.
-- =====================================================================

-- 1) Nouvelle colonne services
alter table public.leads
  add column if not exists services text[] not null default '{}';

-- 2) Backfill : si l'ancienne colonne `service` existe, on migre le contenu
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'leads'
      and column_name = 'service'
  ) then
    update public.leads
       set services = array[service]
     where (services is null or array_length(services, 1) is null)
       and service is not null;

    -- 3) Suppression de l'ancienne colonne
    alter table public.leads drop column service;
  end if;
end $$;

-- 4) Check constraint sur les valeurs autorisées
alter table public.leads
  drop constraint if exists leads_services_valid;

alter table public.leads
  add constraint leads_services_valid
  check (
    services <@ array[
      'chauffage','pac','clim','sanitaire','enr','depannage','autre'
    ]::text[]
    and array_length(services, 1) between 1 and 7
  );

-- 5) Index GIN pour recherche par service
create index if not exists leads_services_gin on public.leads using gin (services);
