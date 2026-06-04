/**
 * Store des offres d'emploi publiées sur /recrutement.
 *
 * Adapter dual : fichier `data/jobs.json` en dev, Supabase en prod si les env
 * vars SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY sont définies.
 *
 * Failsafe Vercel : si le filesystem est read-only, on bascule en mémoire
 * (pareil pattern que leads-store) — bonne pratique pour démo serverless
 * sans casser le code de l'admin.
 *
 * Table Supabase attendue (SQL dans supabase/migrations/0002_jobs.sql) :
 *   jobs (
 *     id text primary key,
 *     slug text unique not null,
 *     title text not null,
 *     contract_type text not null,     -- CDI, CDD, intérim, alternance, stage
 *     work_time text not null,         -- plein, partiel
 *     salary_min int, salary_max int,  -- en €, optionnel
 *     description text not null,
 *     benefits text[] default '{}',
 *     published_at timestamptz not null default now(),
 *     status text not null default 'open'  -- open | closed | draft
 *   )
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

export type JobStatus = "open" | "closed" | "draft";
export type ContractType =
  | "CDI"
  | "CDD"
  | "interim"
  | "alternance"
  | "stage"
  | "freelance";
export type WorkTime = "plein" | "partiel";

export type JobRecord = {
  id: string;
  slug: string;
  title: string;
  contractType: ContractType;
  workTime: WorkTime;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  benefits: string[];
  publishedAt: string;
  status: JobStatus;
};

const DATA_DIR = path.join(process.cwd(), "data");
const JOBS_FILE = path.join(DATA_DIR, "jobs.json");

const VERCEL_READONLY = !!process.env.VERCEL;
let __memoryJobs: JobRecord[] | null = null;

function useSupabase(): boolean {
  return !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

async function ensureDir() {
  if (VERCEL_READONLY) return;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    /* ignore */
  }
}

async function readFs(): Promise<JobRecord[]> {
  if (VERCEL_READONLY && __memoryJobs) return __memoryJobs;
  try {
    const raw = await fs.readFile(JOBS_FILE, "utf8");
    return JSON.parse(raw) as JobRecord[];
  } catch {
    return SEED_JOBS;
  }
}

async function writeFs(jobs: JobRecord[]): Promise<void> {
  if (VERCEL_READONLY) {
    __memoryJobs = jobs;
    return;
  }
  try {
    await ensureDir();
    await fs.writeFile(JOBS_FILE, JSON.stringify(jobs, null, 2), "utf8");
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "EROFS" || code === "EACCES" || code === "EPERM") {
      __memoryJobs = jobs;
      return;
    }
    throw e;
  }
}

/* ─────────────── Adapter Supabase ─────────────── */

function sbHeaders(): HeadersInit {
  return {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

function sbRest(path: string): string {
  return `${process.env.SUPABASE_URL}/rest/v1${path}`;
}

type SbJob = {
  id: string;
  slug: string;
  title: string;
  contract_type: ContractType;
  work_time: WorkTime;
  salary_min: number | null;
  salary_max: number | null;
  description: string;
  benefits: string[] | null;
  published_at: string;
  status: JobStatus;
};

function fromSb(r: SbJob): JobRecord {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    contractType: r.contract_type,
    workTime: r.work_time,
    salaryMin: r.salary_min ?? undefined,
    salaryMax: r.salary_max ?? undefined,
    description: r.description,
    benefits: r.benefits ?? [],
    publishedAt: r.published_at,
    status: r.status,
  };
}

function toSb(j: JobRecord): Partial<SbJob> {
  return {
    id: j.id,
    slug: j.slug,
    title: j.title,
    contract_type: j.contractType,
    work_time: j.workTime,
    salary_min: j.salaryMin ?? null,
    salary_max: j.salaryMax ?? null,
    description: j.description,
    benefits: j.benefits,
    published_at: j.publishedAt,
    status: j.status,
  };
}

/* ─────────────── API publique ─────────────── */

export async function listJobs(
  opts: { status?: JobStatus } = {},
): Promise<JobRecord[]> {
  if (useSupabase()) {
    try {
      const url = sbRest(
        `/jobs?select=*${opts.status ? `&status=eq.${opts.status}` : ""}&order=published_at.desc`,
      );
      const res = await fetch(url, { headers: sbHeaders() });
      if (res.ok) {
        const rows = (await res.json()) as SbJob[];
        // Si Supabase est branché mais la table est vide, on retombe sur le
        // seed (filtré sur status si demandé) pour ne pas afficher une page
        // recrutement déserte en démo. Une fois que l'admin aura créé sa
        // première vraie offre, le seed disparaîtra automatiquement.
        if (rows.length === 0) {
          const seed = opts.status
            ? SEED_JOBS.filter((j) => j.status === opts.status)
            : SEED_JOBS;
          return [...seed].sort((a, b) =>
            b.publishedAt.localeCompare(a.publishedAt),
          );
        }
        return rows.map(fromSb);
      }
      // 4xx/5xx → on log et on retombe sur seed (table peut-être pas encore créée)
      console.warn(`[jobs-store] Supabase list failed: ${res.status}, fallback seed`);
    } catch (e) {
      console.warn("[jobs-store] Supabase network error, fallback seed:", e);
    }
    // Fallback gracieux — démontre quand même les 3 offres
    const seed = opts.status
      ? SEED_JOBS.filter((j) => j.status === opts.status)
      : SEED_JOBS;
    return [...seed].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }
  const all = await readFs();
  const filtered = opts.status ? all.filter((j) => j.status === opts.status) : all;
  return filtered.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getJobBySlug(slug: string): Promise<JobRecord | null> {
  if (useSupabase()) {
    const res = await fetch(
      sbRest(`/jobs?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`),
      { headers: sbHeaders() },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as SbJob[];
    return rows[0] ? fromSb(rows[0]) : null;
  }
  const all = await readFs();
  return all.find((j) => j.slug === slug) ?? null;
}

export async function createJob(
  input: Omit<JobRecord, "id" | "publishedAt">,
): Promise<JobRecord> {
  const record: JobRecord = {
    ...input,
    id: randomBytes(8).toString("hex"),
    publishedAt: new Date().toISOString(),
  };
  if (useSupabase()) {
    const res = await fetch(sbRest("/jobs"), {
      method: "POST",
      headers: sbHeaders(),
      body: JSON.stringify(toSb(record)),
    });
    if (!res.ok) throw new Error(`Supabase insert job failed: ${res.status}`);
    return record;
  }
  const all = await readFs();
  all.unshift(record);
  await writeFs(all);
  return record;
}

export async function updateJob(
  id: string,
  patch: Partial<Omit<JobRecord, "id">>,
): Promise<JobRecord | null> {
  if (useSupabase()) {
    const merged: Partial<SbJob> = {
      ...(patch.slug !== undefined && { slug: patch.slug }),
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.contractType !== undefined && {
        contract_type: patch.contractType,
      }),
      ...(patch.workTime !== undefined && { work_time: patch.workTime }),
      ...(patch.salaryMin !== undefined && {
        salary_min: patch.salaryMin ?? null,
      }),
      ...(patch.salaryMax !== undefined && {
        salary_max: patch.salaryMax ?? null,
      }),
      ...(patch.description !== undefined && { description: patch.description }),
      ...(patch.benefits !== undefined && { benefits: patch.benefits }),
      ...(patch.status !== undefined && { status: patch.status }),
    };
    const res = await fetch(sbRest(`/jobs?id=eq.${id}`), {
      method: "PATCH",
      headers: sbHeaders(),
      body: JSON.stringify(merged),
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as SbJob[];
    return rows[0] ? fromSb(rows[0]) : null;
  }
  const all = await readFs();
  const idx = all.findIndex((j) => j.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch };
  await writeFs(all);
  return all[idx];
}

export async function deleteJob(id: string): Promise<boolean> {
  if (useSupabase()) {
    const res = await fetch(sbRest(`/jobs?id=eq.${id}`), {
      method: "DELETE",
      headers: sbHeaders(),
    });
    return res.ok;
  }
  const all = await readFs();
  const next = all.filter((j) => j.id !== id);
  if (next.length === all.length) return false;
  await writeFs(next);
  return true;
}

/* ─────────────── Seed démo (3 offres) ─────────────── */

export const SEED_JOBS: JobRecord[] = [
  {
    id: "seed-1",
    slug: "chauffagiste-confirme-cdi",
    title: "Chauffagiste confirmé — CDI",
    contractType: "CDI",
    workTime: "plein",
    salaryMin: 3200,
    salaryMax: 4200,
    description: `Vous rejoignez une équipe de techniciens passionnés au sein d'une entreprise familiale luxembourgeoise.

**Votre mission**
- Installation, dépannage et entretien de chaudières gaz, fioul et pompes à chaleur
- Lecture de plans, mise en route et essais d'étanchéité
- Conseil technique au client sur site
- Reporting via tablette mobile

**Profil recherché**
- Formation chauffagiste / CFC sanitaire-chauffage
- 3 ans d'expérience minimum
- Permis B requis
- Français courant (allemand ou luxembourgeois apprécié)
- Esprit d'équipe et goût du travail bien fait

**Ce qu'on vous offre**
- Salaire attractif négocié selon expérience (3 200 – 4 200 €/mois)
- Véhicule de service + carte essence
- Outillage neuf renouvelé tous les 3 ans
- Formation continue chez fabricants (Vaillant, Viessmann, Daikin)
- 30 jours de congés + RTT
- Mutuelle santé prise en charge`,
    benefits: [
      "Véhicule de service inclus",
      "Outillage pro renouvelé tous les 3 ans",
      "Formation continue chez fabricants",
      "Mutuelle santé prise en charge",
      "30 jours de congés + RTT",
      "Prime de fin d'année",
    ],
    publishedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    status: "open",
  },
  {
    id: "seed-2",
    slug: "frigoriste-clim-tertiaire-cdi",
    title: "Frigoriste / Climaticien tertiaire — CDI",
    contractType: "CDI",
    workTime: "plein",
    salaryMin: 3400,
    salaryMax: 4500,
    description: `Spécialiste froid / clim pour notre pôle tertiaire (bureaux, commerces, salles techniques).

**Votre quotidien**
- Installation systèmes VRV/VRF Daikin, Mitsubishi, LG
- Maintenance préventive et curative sur parc clients
- Récupération fluides frigorigènes, attestations
- Diagnostic à distance via outils connectés

**Profil**
- CAP/BEP froid et climatisation
- Attestation d'aptitude fluides frigorigènes (cat. I obligatoire)
- 3-5 ans d'expérience sur chantiers tertiaires
- Permis B obligatoire

**Avantages**
- Salaire 3 400 – 4 500 €/mois selon profil
- Véhicule de service tout équipé
- Téléphone + tablette pro
- Astreinte rémunérée (volontaire)
- Évolution possible chef d'équipe sous 2 ans`,
    benefits: [
      "Véhicule service tout équipé",
      "Téléphone + tablette pro",
      "Astreinte rémunérée",
      "Évolution chef d'équipe possible",
      "Plan de formation Daikin/Mitsubishi",
    ],
    publishedAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
    status: "open",
  },
  {
    id: "seed-3",
    slug: "apprenti-installateur-sanitaire",
    title: "Apprenti·e installateur·trice sanitaire (CFC)",
    contractType: "alternance",
    workTime: "plein",
    salaryMin: 900,
    salaryMax: 1800,
    description: `Tu prépares un CFC d'installateur sanitaire ou de chauffagiste ? Rejoins notre atelier pour ton apprentissage.

**On t'apprend**
- Le geste technique propre, pas vite-fait
- La lecture de plans, le dimensionnement
- Le contact client respectueux
- L'usage des outils pros (sertisseuses, caméras d'inspection, analyseurs)

**Tu seras encadré par**
- Un tuteur dédié pendant 3 ans
- Une équipe bienveillante
- Des chantiers variés (résidentiel, tertiaire, dépannage)

**Conditions**
- Salaire d'apprenti·e selon barème (900 – 1 800 €/mois selon année)
- Cours pris en charge par l'entreprise
- Permis B financé en 2e année si besoin
- Embauche en CDI à la sortie si match`,
    benefits: [
      "Tuteur dédié pendant 3 ans",
      "Cours pris en charge",
      "Permis B financé en 2e année",
      "CDI à la sortie si match",
      "Outillage pro fourni",
    ],
    publishedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    status: "open",
  },
];
