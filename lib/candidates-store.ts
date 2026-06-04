/**
 * Store des candidatures spontanées + sur offre.
 *
 * Le CV est stocké :
 *   - en dev/serverless : data/cvs/<id>.pdf (failsafe mémoire si EROFS)
 *   - en prod Supabase  : Storage bucket "candidates-cvs"
 *
 * Table Supabase : candidates(
 *   id text primary key,
 *   job_id text references jobs(id) on delete set null,
 *   first_name text not null, last_name text not null,
 *   email text not null, phone text not null,
 *   message text,
 *   cv_url text,
 *   status text default 'new',  -- new | reviewed | shortlisted | rejected | hired
 *   created_at timestamptz default now()
 * )
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

export type CandidateStatus =
  | "new"
  | "reviewed"
  | "shortlisted"
  | "rejected"
  | "hired";

export type CandidateRecord = {
  id: string;
  jobId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message?: string;
  cvUrl?: string;
  status: CandidateStatus;
  createdAt: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "candidates.json");
const CVS_DIR = path.join(DATA_DIR, "cvs");

const VERCEL_READONLY = !!process.env.VERCEL;
let __memory: CandidateRecord[] | null = null;
const __memoryCvs: Map<string, Buffer> = new Map();

function useSupabase(): boolean {
  return !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

async function ensureDir(dir: string) {
  if (VERCEL_READONLY) return;
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {
    /* ignore */
  }
}

async function readAll(): Promise<CandidateRecord[]> {
  if (VERCEL_READONLY && __memory) return __memory;
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as CandidateRecord[];
  } catch {
    return [];
  }
}

async function writeAll(items: CandidateRecord[]): Promise<void> {
  if (VERCEL_READONLY) {
    __memory = items;
    return;
  }
  try {
    await ensureDir(DATA_DIR);
    await fs.writeFile(FILE, JSON.stringify(items, null, 2), "utf8");
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "EROFS" || code === "EACCES" || code === "EPERM") {
      __memory = items;
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
function sbStorage(path: string): string {
  return `${process.env.SUPABASE_URL}/storage/v1${path}`;
}

type SbRow = {
  id: string;
  job_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  message: string | null;
  cv_url: string | null;
  status: CandidateStatus;
  created_at: string;
};

function fromSb(r: SbRow): CandidateRecord {
  return {
    id: r.id,
    jobId: r.job_id ?? undefined,
    firstName: r.first_name,
    lastName: r.last_name,
    email: r.email,
    phone: r.phone,
    message: r.message ?? undefined,
    cvUrl: r.cv_url ?? undefined,
    status: r.status,
    createdAt: r.created_at,
  };
}

function toSb(c: CandidateRecord): Partial<SbRow> {
  return {
    id: c.id,
    job_id: c.jobId ?? null,
    first_name: c.firstName,
    last_name: c.lastName,
    email: c.email,
    phone: c.phone,
    message: c.message ?? null,
    cv_url: c.cvUrl ?? null,
    status: c.status,
    created_at: c.createdAt,
  };
}

/* ─────────────── CV (PDF) storage ─────────────── */

/**
 * Sauvegarde un CV PDF. Retourne l'URL/clé pour récupération ultérieure.
 * - Supabase : upload dans le bucket `candidates-cvs`, retourne le path
 * - Local : écrit data/cvs/<id>.pdf
 * - Serverless read-only : garde en mémoire de l'instance (pour démo)
 */
export async function storeCv(
  id: string,
  buffer: Buffer,
  filename: string,
): Promise<string> {
  if (useSupabase()) {
    const key = `${id}/${filename}`;
    const res = await fetch(sbStorage(`/object/candidates-cvs/${key}`), {
      method: "POST",
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        "Content-Type": "application/pdf",
      },
      body: new Uint8Array(buffer),
    });
    if (!res.ok) throw new Error(`Supabase CV upload failed: ${res.status}`);
    return key;
  }
  if (VERCEL_READONLY) {
    __memoryCvs.set(id, buffer);
    return `memory://${id}`;
  }
  await ensureDir(CVS_DIR);
  const filePath = path.join(CVS_DIR, `${id}.pdf`);
  await fs.writeFile(filePath, new Uint8Array(buffer));
  return `local:${id}.pdf`;
}

/* ─────────────── API publique ─────────────── */

export async function listCandidates(opts: {
  jobId?: string;
} = {}): Promise<CandidateRecord[]> {
  if (useSupabase()) {
    const url = sbRest(
      `/candidates?select=*${opts.jobId ? `&job_id=eq.${opts.jobId}` : ""}&order=created_at.desc`,
    );
    const res = await fetch(url, { headers: sbHeaders() });
    if (!res.ok) throw new Error(`Supabase list candidates failed: ${res.status}`);
    const rows = (await res.json()) as SbRow[];
    return rows.map(fromSb);
  }
  const all = await readAll();
  const filtered = opts.jobId ? all.filter((c) => c.jobId === opts.jobId) : all;
  return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createCandidate(
  input: Omit<CandidateRecord, "id" | "status" | "createdAt">,
): Promise<CandidateRecord> {
  const record: CandidateRecord = {
    ...input,
    id: randomBytes(8).toString("hex"),
    status: "new",
    createdAt: new Date().toISOString(),
  };
  if (useSupabase()) {
    const res = await fetch(sbRest("/candidates"), {
      method: "POST",
      headers: sbHeaders(),
      body: JSON.stringify(toSb(record)),
    });
    if (!res.ok)
      throw new Error(`Supabase insert candidate failed: ${res.status}`);
    return record;
  }
  const all = await readAll();
  all.unshift(record);
  await writeAll(all);
  return record;
}

export async function updateCandidateStatus(
  id: string,
  status: CandidateStatus,
): Promise<CandidateRecord | null> {
  if (useSupabase()) {
    const res = await fetch(sbRest(`/candidates?id=eq.${id}`), {
      method: "PATCH",
      headers: sbHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as SbRow[];
    return rows[0] ? fromSb(rows[0]) : null;
  }
  const all = await readAll();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], status };
  await writeAll(all);
  return all[idx];
}
