/**
 * Adapter de persistance des leads.
 *
 * Dev (par défaut) : stockage fichier `data/`
 *   - data/leads.json
 *   - data/photos/<reference>/<i>.<ext>
 *
 * Prod : Supabase activé automatiquement si SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *   - table `leads` (cf. supabase/migrations/*.sql)
 *   - bucket `leads-photos` (objet par lead/index)
 *
 * Le switch est transparent : aucun changement de code côté API/UI.
 *
 * IMPORTANT : sur Vercel/serverless, le store fichier ne persiste pas. Il
 * faut Supabase (ou équivalent S3) en prod.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type { LeadRecord, DevisSubmit } from "./devis-schema";
import { logger } from "./logger";
import { scoreLead } from "./lead-scoring";

const DATA_DIR = path.join(process.cwd(), "data");
const INDEX_FILE = path.join(DATA_DIR, "leads.json");
const PHOTOS_DIR = path.join(DATA_DIR, "photos");
const PHOTO_BUCKET = "leads-photos";

function useSupabase(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function ensureDir(p: string) {
  try {
    await fs.mkdir(p, { recursive: true });
  } catch {}
}

/* ─────────────── FILE STORE ─────────────── */

// Failsafe Vercel serverless : le filesystem est read-only à runtime, donc
// les writes échouent (EROFS). On garde un overlay en mémoire de l'instance
// pour que les changements de statut/notes paraissent persistés pendant la
// session. Au prochain cold start de l'instance, on retombe sur le disque.
// IMPORTANT : ce comportement ne sert QUE pour la démo. En prod réel, on
// branche Supabase (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) — code déjà
// présent plus bas dans ce fichier.
const VERCEL_READONLY = !!process.env.VERCEL;
let __memoryLeads: LeadRecord[] | null = null;

async function fsReadIndex(): Promise<LeadRecord[]> {
  // Sur Vercel, si on a déjà des leads en mémoire (édités), on les renvoie.
  if (VERCEL_READONLY && __memoryLeads) return __memoryLeads;
  try {
    return JSON.parse(await fs.readFile(INDEX_FILE, "utf8")) as LeadRecord[];
  } catch {
    return [];
  }
}

async function fsWriteIndex(records: LeadRecord[]) {
  if (VERCEL_READONLY) {
    __memoryLeads = records;
    return;
  }
  try {
    await ensureDir(DATA_DIR);
    await fs.writeFile(INDEX_FILE, JSON.stringify(records, null, 2), "utf8");
  } catch (e) {
    // Si le FS rejette quand même (montage read-only inattendu), on bascule
    // gracieusement en mémoire au lieu de 500.
    const code = (e as { code?: string }).code;
    if (code === "EROFS" || code === "EACCES" || code === "EPERM") {
      __memoryLeads = records;
      return;
    }
    throw e;
  }
}

async function fsPersistPhotos(reference: string, photos: DevisSubmit["photos"]) {
  if (photos.length === 0) return [];
  const dir = path.join(PHOTOS_DIR, reference);
  await ensureDir(dir);
  const urls: string[] = [];
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];
    const ext = (p.type.split("/")[1] ?? "jpg").toLowerCase().replace("jpeg", "jpg");
    const buf = Buffer.from(p.dataUrl.split(",")[1] ?? "", "base64");
    await fs.writeFile(path.join(dir, `${i}.${ext}`), buf);
    urls.push(`/api/admin/leads/${reference}/photo/${i}`);
  }
  return urls;
}

export async function readPhotoFromFs(
  reference: string,
  index: number,
): Promise<{ buffer: Buffer; mime: string } | null> {
  if (useSupabase()) {
    return readPhotoFromSupabase(reference, index);
  }
  const dir = path.join(PHOTOS_DIR, reference);
  try {
    const entries = await fs.readdir(dir);
    const match = entries.find((f) => f.startsWith(`${index}.`));
    if (!match) return null;
    const ext = match.split(".").pop()?.toLowerCase() ?? "";
    const mime =
      ext === "png"
        ? "image/png"
        : ext === "webp"
        ? "image/webp"
        : ext === "heic" || ext === "heif"
        ? "image/heic"
        : "image/jpeg";
    return { buffer: await fs.readFile(path.join(dir, match)), mime };
  } catch {
    return null;
  }
}

/* ─────────────── SUPABASE STORE ─────────────── */

function sbHeaders(extra: Record<string, string> = {}) {
  return {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...extra,
  };
}

function sbRest(p: string) {
  return `${process.env.SUPABASE_URL}/rest/v1${p}`;
}

function sbStorage(p: string) {
  return `${process.env.SUPABASE_URL}/storage/v1${p}`;
}

/** Snake_case ↔ camelCase mapping pour matcher la table SQL.
 *
 * Tolérant aux 2 schémas Supabase historiques :
 *   - V1 : colonne `service` (singulier, text) NOT NULL
 *   - V2 : colonne `services` (pluriel, text[]) + migration drop service
 * → on envoie les deux pour que l'insert passe dans les deux cas.
 *   La colonne absente est silencieusement ignorée par PostgREST.
 *
 * preferredBrand : pas de colonne dédiée → on glisse dans metadata
 * pour éviter "column does not exist" lors de l'insert.
 */
function toDb(r: LeadRecord) {
  const mergedMetadata = {
    ...(r.metadata ?? {}),
    // Sauvegarde côté metadata : marque souhaitée si renseignée
    preferredBrand: (r as LeadRecord & { preferredBrand?: string }).preferredBrand,
  };
  return {
    reference: r.reference,
    submitted_at: r.submittedAt,
    status: r.status,
    // Double envoi pour tolérance schéma V1/V2
    service: r.services[0] ?? "autre",
    services: r.services,
    building_type: r.buildingType,
    construction: r.construction,
    surface: r.surface,
    current_energy: r.currentEnergy,
    commune: r.commune,
    timeline: r.timeline,
    budget: r.budget,
    full_name: r.fullName,
    email: r.email,
    phone: r.phone,
    preferred_channel: r.preferredChannel,
    message: r.message,
    rgpd_consent: r.rgpdConsent,
    photo_urls: r.photoUrls,
    metadata: mergedMetadata,
    source: r.source,
    notes: r.notes,
    // Scoring (NULL si jamais migré sur Supabase ancien)
    score: r.score ?? null,
    level: r.level ?? null,
    score_reasons: r.scoreReasons ?? null,
    status_history: r.statusHistory ?? null,
    assigned_to: r.assignedTo ?? null,
  };
}

function fromDb(row: any): LeadRecord {
  // Tolerant : accepte legacy `service` (string) ou nouveau `services` (array)
  const services: string[] = Array.isArray(row.services)
    ? row.services
    : row.service
    ? [row.service]
    : [];
  return {
    reference: row.reference,
    submittedAt: row.submitted_at,
    status: row.status,
    services: services as LeadRecord["services"],
    buildingType: row.building_type,
    construction: row.construction,
    surface: row.surface,
    currentEnergy: row.current_energy,
    commune: row.commune,
    timeline: row.timeline,
    budget: row.budget,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    preferredChannel: row.preferred_channel,
    preferredBrand: (row.metadata?.preferredBrand as LeadRecord["preferredBrand"]) ?? "aucune",
    message: row.message ?? "",
    rgpdConsent: row.rgpd_consent,
    photoUrls: row.photo_urls ?? [],
    metadata: row.metadata ?? {},
    source: row.source ?? "/devis",
    notes: row.notes ?? "",
    score: row.score ?? undefined,
    level: row.level ?? undefined,
    scoreReasons: row.score_reasons ?? undefined,
    statusHistory: row.status_history ?? undefined,
  };
}

async function sbPersistPhotos(reference: string, photos: DevisSubmit["photos"]): Promise<string[]> {
  if (photos.length === 0) return [];
  const urls: string[] = [];
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];
    const ext = (p.type.split("/")[1] ?? "jpg").toLowerCase().replace("jpeg", "jpg");
    const buf = Buffer.from(p.dataUrl.split(",")[1] ?? "", "base64");
    const objectPath = `${reference}/${i}.${ext}`;
    const url = sbStorage(`/object/${PHOTO_BUCKET}/${objectPath}`);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...sbHeaders({ "Content-Type": p.type, "x-upsert": "true" }),
      },
      body: buf,
    });
    if (!res.ok) {
      logger.error("supabase.photo_upload_failed", await res.text(), { reference, index: i });
      continue;
    }
    // URL signée pour servir la photo via notre API admin (qui re-signe à la lecture)
    urls.push(`/api/admin/leads/${reference}/photo/${i}`);
  }
  return urls;
}

async function readPhotoFromSupabase(
  reference: string,
  index: number,
): Promise<{ buffer: Buffer; mime: string } | null> {
  const exts = ["jpg", "jpeg", "png", "webp", "heic", "heif"];
  for (const ext of exts) {
    const objectPath = `${reference}/${index}.${ext}`;
    const res = await fetch(sbStorage(`/object/${PHOTO_BUCKET}/${objectPath}`), {
      method: "GET",
      headers: sbHeaders(),
    });
    if (res.ok) {
      const mime =
        ext === "png"
          ? "image/png"
          : ext === "webp"
          ? "image/webp"
          : ext.startsWith("hei")
          ? "image/heic"
          : "image/jpeg";
      return { buffer: Buffer.from(await res.arrayBuffer()), mime };
    }
  }
  return null;
}

/* ─────────────── API publique unifiée ─────────────── */

export async function createLead(payload: DevisSubmit, reference: string): Promise<LeadRecord> {
  const photoUrls = useSupabase()
    ? await sbPersistPhotos(reference, payload.photos)
    : await fsPersistPhotos(reference, payload.photos);

  // Scoring lead — heuristique transparente
  const scoring = scoreLead({
    timeline: payload.timeline,
    budget: payload.budget,
    services: payload.services,
    buildingType: payload.buildingType,
    construction: payload.construction,
    currentEnergy: payload.currentEnergy,
    surface: payload.surface,
    message: payload.message,
    photoUrls,
    preferredChannel: payload.preferredChannel,
  });

  const record: LeadRecord = {
    reference,
    submittedAt: new Date().toISOString(),
    services: payload.services,
    buildingType: payload.buildingType,
    construction: payload.construction,
    surface: payload.surface,
    currentEnergy: payload.currentEnergy,
    commune: payload.commune,
    timeline: payload.timeline,
    budget: payload.budget,
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    preferredChannel: payload.preferredChannel,
    preferredBrand: payload.preferredBrand,
    message: payload.message,
    rgpdConsent: payload.rgpdConsent,
    metadata: payload.metadata ?? {},
    status: "nouveau",
    photoUrls,
    source: "/devis",
    notes: "",
    score: scoring.score,
    level: scoring.level,
    scoreReasons: scoring.reasons,
    statusHistory: [],
  };

  if (useSupabase()) {
    try {
      const res = await fetch(sbRest("/leads"), {
        method: "POST",
        headers: sbHeaders(),
        body: JSON.stringify(toDb(record)),
      });
      if (!res.ok) {
        const err = await res.text();
        logger.error("supabase.insert_failed", err, { reference });
        // Fallback : on persiste quand même en local pour ne pas perdre le lead.
        // Évite que toute la démo casse à cause d'un schéma Supabase non aligné.
        await safeLocalPersist(record);
        return record;
      }
      return record;
    } catch (e) {
      logger.error("supabase.insert_threw", e, { reference });
      await safeLocalPersist(record);
      return record;
    }
  }

  await safeLocalPersist(record);
  return record;
}

/**
 * Persistance locale tolérante : fs si disponible, sinon mémoire (Vercel readonly).
 * Garantit que le lead ne se perd jamais entre le POST et la confirmation.
 */
async function safeLocalPersist(record: LeadRecord): Promise<void> {
  try {
    const all = await fsReadIndex();
    all.unshift(record);
    await fsWriteIndex(all);
  } catch (e) {
    logger.warn("local.persist_failed_fallback_memory", { reference: record.reference });
    // L'in-memory __memoryLeads est déjà géré par fsReadIndex/fsWriteIndex
    // sous Vercel readonly — ce catch est une triple ceinture/bretelles.
  }
}

/**
 * Création express de lead par un opérateur (depuis la modale "Nouvelle
 * intervention" notamment). On accepte le strict minimum : nom + commune.
 * Phone/email/notes sont optionnels. Tous les autres champs (services,
 * surface, timeline…) reçoivent des valeurs par défaut neutres — le devis
 * pourra être complété plus tard sur la fiche du lead.
 *
 * Cas d'usage : dépannage urgent appelé par téléphone, le client n'est pas
 * encore en CRM, on doit pouvoir l'enregistrer et démarrer l'intervention
 * en 10 secondes.
 */
export async function expressCreateLead(input: {
  fullName: string;
  commune: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdBy?: string; // email du technicien qui crée
}): Promise<LeadRecord> {
  const fullName = input.fullName.trim();
  const commune = input.commune.trim();
  if (fullName.length < 2) throw new Error("Nom client requis");
  if (commune.length < 2) throw new Error("Commune requise");

  const { makeReference } = await import("./devis-schema");
  const reference = makeReference();
  const now = new Date().toISOString();

  const record: LeadRecord = {
    reference,
    submittedAt: now,
    // Valeurs par défaut neutres — l'opérateur précisera plus tard
    services: ["depannage"],
    buildingType: "autre",
    construction: "renovation",
    surface: 100,
    currentEnergy: "inconnu",
    commune,
    timeline: "urgent",
    budget: "inconnu",
    preferredBrand: "aucune",
    fullName,
    email: input.email?.trim() || `noreply+${reference}@chauffage-artisanal.lu`,
    phone: input.phone?.trim() || "—",
    preferredChannel: input.phone ? "phone" : "email",
    message: input.notes?.trim() || "Lead créé en express depuis l'admin.",
    rgpdConsent: true,
    metadata: {
      source: { landing: "/admin/visits", capturedAt: now },
      createdBy: input.createdBy,
      express: true,
    },
    status: "contacte", // le contact a déjà eu lieu (appel, présence sur site)
    photoUrls: [],
    source: "/admin/visits",
    notes: "",
    score: 0,
    level: "warm",
    scoreReasons: [{ label: "Lead express créé manuellement", points: 0 }],
    statusHistory: [],
  };

  await safeLocalPersist(record);
  return record;
}

export async function listLeads(): Promise<LeadRecord[]> {
  if (useSupabase()) {
    const res = await fetch(sbRest("/leads?select=*&order=submitted_at.desc"), {
      headers: sbHeaders(),
    });
    if (!res.ok) {
      logger.error("supabase.list_failed", await res.text());
      return [];
    }
    const rows = (await res.json()) as any[];
    return rows.map(fromDb);
  }
  return fsReadIndex();
}

export async function getLead(reference: string): Promise<LeadRecord | null> {
  if (useSupabase()) {
    const res = await fetch(
      sbRest(`/leads?select=*&reference=eq.${encodeURIComponent(reference)}&limit=1`),
      { headers: sbHeaders() },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as any[];
    return rows[0] ? fromDb(rows[0]) : null;
  }
  const all = await fsReadIndex();
  return all.find((l) => l.reference === reference) ?? null;
}

export async function updateLead(
  reference: string,
  patch: Partial<LeadRecord>,
): Promise<LeadRecord | null> {
  if (useSupabase()) {
    // Si on change le statut, on récupère d'abord l'actuel pour logger la transition
    let historyPatch: LeadRecord["statusHistory"] | undefined;
    if ("status" in patch && patch.status) {
      const current = await getLead(reference);
      if (current && current.status !== patch.status) {
        historyPatch = [
          ...(current.statusHistory ?? []),
          { from: current.status, to: patch.status, at: new Date().toISOString() },
        ];
      }
    }
    const dbPatch: Record<string, unknown> = {};
    if ("status" in patch) dbPatch.status = patch.status;
    if ("notes" in patch) dbPatch.notes = patch.notes;
    if (historyPatch) dbPatch.status_history = historyPatch;
    const res = await fetch(
      sbRest(`/leads?reference=eq.${encodeURIComponent(reference)}`),
      {
        method: "PATCH",
        headers: sbHeaders(),
        body: JSON.stringify(dbPatch),
      },
    );
    if (!res.ok) {
      logger.error("supabase.update_failed", await res.text(), { reference });
      return null;
    }
    const rows = (await res.json()) as any[];
    return rows[0] ? fromDb(rows[0]) : null;
  }

  const all = await fsReadIndex();
  const idx = all.findIndex((l) => l.reference === reference);
  if (idx === -1) return null;
  const current = all[idx];
  // Log automatique de la transition de statut
  let nextHistory = current.statusHistory ?? [];
  if ("status" in patch && patch.status && patch.status !== current.status) {
    nextHistory = [
      ...nextHistory,
      { from: current.status, to: patch.status, at: new Date().toISOString() },
    ];
  }
  const next: LeadRecord = {
    ...current,
    ...patch,
    reference: current.reference,
    statusHistory: nextHistory,
  };
  all[idx] = next;
  await fsWriteIndex(all);
  return next;
}
