/**
 * Comptes-rendus de visite d'entretien.
 *
 * Une visite = un compte-rendu structuré rempli sur place par le technicien :
 *   - checklist par type d'équipement (chaudière, PAC, clim…)
 *   - mesures (pression, T°, COP…)
 *   - pièces remplacées
 *   - recommandations / observations
 *
 * Le compte-rendu est lié à un contrat (W23.1) ET optionnellement à un
 * équipement précis (W24.1). Status `draft` → `finalized` (verrouillé).
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const VISITS_FILE = path.join(DATA_DIR, "maintenance-visits.json");

// Vercel monte le filesystem en read-only sur /var/task → on bascule sur
// un store mémoire global qui persiste tant que l'instance Lambda est chaude.
// Même pattern que analytics-store, quote-templates-store, leads-store.
const VERCEL_READONLY = !!process.env.VERCEL;

const globalAny = globalThis as unknown as {
  __memoryMaintenanceVisits?: MaintenanceVisit[];
};

export type ChecklistStatus = "ok" | "warn" | "ko";

export type ChecklistItem = {
  key: string;
  label: string;
  status: ChecklistStatus;
  comment?: string;
};

export type Measurement = {
  key: string;
  label: string;
  value: string;
  unit?: string;
};

export type ReplacedPart = {
  description: string;
  quantity: number;
  reference?: string;
};

/**
 * Note horodatée prise par le technicien pendant l'intervention.
 * Journal chronologique distinct du champ `observations` (synthèse finale).
 */
export type InterventionNote = {
  id: string;
  at: string; // ISO timestamp
  text: string;
  author?: string; // email technicien si connu au moment de l'ajout
};

/**
 * Signature client capturée sur place (tablette / mobile).
 * dataUrl = PNG base64 (~5-30 KB pour un trait de signature).
 * Conservée comme preuve de la conformité de la prestation.
 */
export type ClientSignature = {
  dataUrl: string; // "data:image/png;base64,..."
  signerName: string;
  signedAt: string; // ISO timestamp
};

export type VisitStatus = "draft" | "finalized";

/**
 * Type métier d'intervention. Élargi par rapport à la v1 où tout était
 * forcément lié à un contrat d'entretien.
 *   - entretien : visite récurrente sous contrat (origine v1)
 *   - depannage : intervention urgente / panne
 *   - pose     : installation nouvelle (PAC, chaudière, salle de bain…)
 *   - diagnostic : visite d'évaluation / chiffrage
 */
export type VisitType = "entretien" | "depannage" | "pose" | "diagnostic";

export type MaintenanceVisit = {
  id: string;
  /** Optionnel : seuls les entretiens sous contrat ont un contractId. */
  contractId?: string;
  leadReference: string;
  equipmentId?: string;
  type: VisitType;
  visitedAt: string;
  technicianEmail?: string;
  durationMin?: number;
  checklist: ChecklistItem[];
  measurements: Measurement[];
  partsReplaced: ReplacedPart[];
  recommendations?: string;
  observations?: string;
  interventionNotes?: InterventionNote[];
  clientSignature?: ClientSignature;
  status: VisitStatus;
  finalizedAt?: string;
  createdAt: string;
  updatedAt: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

/* ─────────────── SUPABASE STORE ─────────────── */

/**
 * Gating Supabase : si SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY sont set
 * dans l'env (cf. Vercel project settings), toutes les opérations passent
 * par PostgREST. Sinon → file/mémoire en local et dev. Même pattern que
 * leads-store.
 */
function useSupabase(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

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

/* Mapping snake_case ↔ camelCase pour matcher la table SQL */

type SbRow = {
  id: string;
  contract_id: string | null;
  lead_reference: string;
  equipment_id: string | null;
  type: VisitType;
  visited_at: string;
  technician_email: string | null;
  duration_min: number | null;
  checklist: ChecklistItem[] | null;
  measurements: Measurement[] | null;
  parts_replaced: ReplacedPart[] | null;
  recommendations: string | null;
  observations: string | null;
  intervention_notes: InterventionNote[] | null;
  client_signature: ClientSignature | null;
  status: VisitStatus;
  finalized_at: string | null;
  created_at: string;
  updated_at: string;
};

function toDb(v: MaintenanceVisit): SbRow {
  return {
    id: v.id,
    contract_id: v.contractId ?? null,
    lead_reference: v.leadReference,
    equipment_id: v.equipmentId ?? null,
    type: v.type,
    visited_at: v.visitedAt,
    technician_email: v.technicianEmail ?? null,
    duration_min: v.durationMin ?? null,
    checklist: v.checklist,
    measurements: v.measurements,
    parts_replaced: v.partsReplaced,
    recommendations: v.recommendations ?? null,
    observations: v.observations ?? null,
    intervention_notes: v.interventionNotes ?? null,
    client_signature: v.clientSignature ?? null,
    status: v.status,
    finalized_at: v.finalizedAt ?? null,
    created_at: v.createdAt,
    updated_at: v.updatedAt,
  };
}

function fromDb(row: SbRow): MaintenanceVisit {
  return {
    id: row.id,
    contractId: row.contract_id ?? undefined,
    leadReference: row.lead_reference,
    equipmentId: row.equipment_id ?? undefined,
    type: row.type ?? "entretien",
    visitedAt: row.visited_at,
    technicianEmail: row.technician_email ?? undefined,
    durationMin: row.duration_min ?? undefined,
    checklist: row.checklist ?? [],
    measurements: row.measurements ?? [],
    partsReplaced: row.parts_replaced ?? [],
    recommendations: row.recommendations ?? undefined,
    observations: row.observations ?? undefined,
    interventionNotes: row.intervention_notes ?? undefined,
    clientSignature: row.client_signature ?? undefined,
    status: row.status,
    finalizedAt: row.finalized_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function sbListAll(): Promise<MaintenanceVisit[]> {
  const res = await fetch(
    sbRest(
      "/maintenance_visits?select=*&order=visited_at.desc",
    ),
    { headers: sbHeaders() },
  );
  if (!res.ok) return [];
  const rows = (await res.json()) as SbRow[];
  return rows.map(fromDb);
}

async function sbGetOne(id: string): Promise<MaintenanceVisit | null> {
  const res = await fetch(
    sbRest(
      `/maintenance_visits?select=*&id=eq.${encodeURIComponent(id)}&limit=1`,
    ),
    { headers: sbHeaders() },
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as SbRow[];
  return rows[0] ? fromDb(rows[0]) : null;
}

async function sbInsert(v: MaintenanceVisit): Promise<void> {
  await fetch(sbRest("/maintenance_visits"), {
    method: "POST",
    headers: sbHeaders(),
    body: JSON.stringify(toDb(v)),
  });
}

async function sbUpdate(id: string, v: MaintenanceVisit): Promise<void> {
  await fetch(
    sbRest(`/maintenance_visits?id=eq.${encodeURIComponent(id)}`),
    {
      method: "PATCH",
      headers: sbHeaders(),
      body: JSON.stringify(toDb(v)),
    },
  );
}

async function sbDelete(id: string): Promise<boolean> {
  const res = await fetch(
    sbRest(`/maintenance_visits?id=eq.${encodeURIComponent(id)}`),
    { method: "DELETE", headers: sbHeaders() },
  );
  return res.ok;
}

/* ─────────────── FILE / MEMORY STORE (fallback) ─────────────── */

async function readAll(): Promise<MaintenanceVisit[]> {
  if (useSupabase()) {
    return sbListAll();
  }
  if (VERCEL_READONLY) {
    return globalAny.__memoryMaintenanceVisits ?? [];
  }
  try {
    const raw = JSON.parse(
      await fs.readFile(VISITS_FILE, "utf8"),
    ) as Partial<MaintenanceVisit>[];
    // Migration douce : les anciennes visites pré-v2 n'ont pas de champ `type`.
    // On les considère comme "entretien" (rétro-compat des données existantes).
    return raw.map((v) => {
      const visit = v as MaintenanceVisit;
      if (!visit.type) visit.type = "entretien";
      return visit;
    });
  } catch {
    return globalAny.__memoryMaintenanceVisits ?? [];
  }
}

async function writeAll(arr: MaintenanceVisit[]) {
  // Maintient toujours le store mémoire à jour — sert de cache même quand
  // l'écriture fichier réussit, et de seul stockage sur Vercel.
  globalAny.__memoryMaintenanceVisits = arr;
  if (useSupabase()) return; // les writes sont faits par sbInsert/sbUpdate
  if (VERCEL_READONLY) return;
  try {
    await ensureDir();
    await fs.writeFile(VISITS_FILE, JSON.stringify(arr, null, 2), "utf8");
  } catch {
    // best-effort : la mémoire suffit en fallback
  }
}

function makeId(): string {
  return `vis-${randomBytes(5).toString("hex")}`;
}

/* ─────────────── Templates checklist par type équipement ─────────────── */

export const CHECKLIST_TEMPLATES: Record<string, ChecklistItem[]> = {
  chaudiere: [
    { key: "pressure", label: "Pression circuit chauffage", status: "ok" },
    { key: "tightness", label: "Étanchéité gaz / eau", status: "ok" },
    { key: "burner", label: "Brûleur / corps de chauffe", status: "ok" },
    { key: "flue", label: "Évacuation des fumées", status: "ok" },
    { key: "safety", label: "Organes de sécurité (soupape, vase)", status: "ok" },
    { key: "regulation", label: "Régulation / thermostat", status: "ok" },
    { key: "combustion", label: "Analyse de combustion", status: "ok" },
  ],
  pac: [
    { key: "fluid", label: "Niveau / pression fluide frigorigène", status: "ok" },
    { key: "compressor", label: "Compresseur (bruit, vibrations)", status: "ok" },
    { key: "evap", label: "Évaporateur / condenseur", status: "ok" },
    { key: "filters", label: "Filtres / batterie", status: "ok" },
    { key: "drain", label: "Évacuation condensats", status: "ok" },
    { key: "regulation", label: "Régulation", status: "ok" },
  ],
  clim: [
    { key: "fluid", label: "Pression fluide frigorigène", status: "ok" },
    { key: "filters", label: "Filtres unités intérieures", status: "ok" },
    { key: "drain", label: "Évacuation condensats", status: "ok" },
    { key: "ext_unit", label: "Unité extérieure", status: "ok" },
    { key: "remote", label: "Télécommande / régulation", status: "ok" },
  ],
  ballon: [
    { key: "anode", label: "Anode sacrificielle", status: "ok" },
    { key: "tightness", label: "Étanchéité raccordements", status: "ok" },
    { key: "thermostat", label: "Thermostat", status: "ok" },
    { key: "safety", label: "Groupe de sécurité", status: "ok" },
  ],
  vmc: [
    { key: "filters", label: "Filtres entrée d'air", status: "ok" },
    { key: "bouches", label: "Bouches d'extraction", status: "ok" },
    { key: "motor", label: "Moteur / débit", status: "ok" },
  ],
  default: [
    { key: "visual", label: "Inspection visuelle générale", status: "ok" },
    { key: "function", label: "Test de fonctionnement", status: "ok" },
  ],
};

export function getChecklistTemplate(equipmentType?: string): ChecklistItem[] {
  if (!equipmentType) return CHECKLIST_TEMPLATES.default;
  return (
    CHECKLIST_TEMPLATES[equipmentType] ?? CHECKLIST_TEMPLATES.default
  ).map((c) => ({ ...c }));
}

/* ─────────────── Reads ─────────────── */

export async function listVisits(opts: {
  contractId?: string;
  leadReference?: string;
} = {}): Promise<MaintenanceVisit[]> {
  const all = await readAll();
  return all
    .filter((v) => {
      if (opts.contractId && v.contractId !== opts.contractId) return false;
      if (opts.leadReference && v.leadReference !== opts.leadReference)
        return false;
      return true;
    })
    .sort((a, b) => b.visitedAt.localeCompare(a.visitedAt));
}

export async function getVisit(id: string): Promise<MaintenanceVisit | null> {
  if (useSupabase()) {
    const direct = await sbGetOne(id);
    if (direct) return direct;
    // Fallback : si le cache mémoire a une copie (créée juste avant
    // que l'écriture Supabase passe), on la rend dispo. Évite un 404
    // race-condition entre POST et GET.
    return (
      globalAny.__memoryMaintenanceVisits?.find((v) => v.id === id) ?? null
    );
  }
  const all = await readAll();
  return all.find((v) => v.id === id) ?? null;
}

/* ─────────────── Mutations ─────────────── */

export async function createVisit(input: {
  /** Optionnel : seules les visites sous contrat ont un contractId. */
  contractId?: string;
  leadReference: string;
  equipmentId?: string;
  equipmentType?: string;
  type?: VisitType;
  visitedAt?: string;
  technicianEmail?: string;
}): Promise<MaintenanceVisit> {
  if (!input.leadReference) throw new Error("leadReference requis");
  const now = new Date();
  const type = input.type ?? "entretien";
  const visit: MaintenanceVisit = {
    id: makeId(),
    contractId: input.contractId,
    leadReference: input.leadReference,
    equipmentId: input.equipmentId,
    type,
    visitedAt: input.visitedAt ?? now.toISOString(),
    technicianEmail: input.technicianEmail,
    // Seuls les entretiens partent d'une checklist pré-remplie ; les
    // autres types (dépannage, pose, diagnostic) commencent à vide.
    checklist:
      type === "entretien" ? getChecklistTemplate(input.equipmentType) : [],
    measurements: [],
    partsReplaced: [],
    status: "draft",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  if (useSupabase()) {
    await sbInsert(visit);
    // Tient aussi le cache mémoire à jour pour les fallbacks immédiats
    const mem = globalAny.__memoryMaintenanceVisits ?? [];
    mem.push(visit);
    globalAny.__memoryMaintenanceVisits = mem;
    return visit;
  }
  const all = await readAll();
  all.push(visit);
  await writeAll(all);
  return visit;
}

export async function updateVisit(
  id: string,
  patch: Partial<
    Pick<
      MaintenanceVisit,
      | "visitedAt"
      | "technicianEmail"
      | "durationMin"
      | "checklist"
      | "measurements"
      | "partsReplaced"
      | "recommendations"
      | "observations"
      | "interventionNotes"
      | "status"
      | "equipmentId"
    >
  > & {
    // null = effacer la signature ; ClientSignature = en poser une nouvelle
    clientSignature?: ClientSignature | null;
  },
): Promise<MaintenanceVisit | null> {
  const all = await readAll();
  const idx = all.findIndex((v) => v.id === id);
  if (idx === -1) return null;
  const cur = all[idx];
  if (cur.status === "finalized" && patch.status !== "draft") {
    // Verrouillage : sur une visite finalisée, seul le passage à `draft`
    // (réouverture explicite) est autorisé. Toute autre modification est bloquée.
    throw new Error("Visite finalisée — impossible de modifier");
  }

  // ─── Validation signature client
  // `null` est accepté côté API pour effacer la signature existante.
  if (patch.clientSignature !== undefined && patch.clientSignature !== null) {
    const sig = patch.clientSignature;
    if (
      !sig.dataUrl ||
      !sig.dataUrl.startsWith("data:image/") ||
      sig.dataUrl.length > 200_000
    ) {
      throw new Error("Signature invalide ou trop volumineuse (max ~150 KB)");
    }
    if (!sig.signerName || sig.signerName.trim().length === 0) {
      throw new Error("Nom du signataire requis");
    }
    if (sig.signerName.length > 120) {
      throw new Error("Nom du signataire trop long");
    }
  }
  // Effacement explicite via null → on retire le champ
  const clearSignature = patch.clientSignature === null;
  const { clientSignature: _sigPatch, ...restPatch } = patch;

  // ─── Validation notes intervention
  if (patch.interventionNotes !== undefined) {
    if (!Array.isArray(patch.interventionNotes)) {
      throw new Error("interventionNotes doit être un tableau");
    }
    if (patch.interventionNotes.length > 200) {
      throw new Error("Trop de notes (max 200)");
    }
    for (const n of patch.interventionNotes) {
      if (!n.id || !n.at || typeof n.text !== "string") {
        throw new Error("Note invalide");
      }
      if (n.text.length > 2000) {
        throw new Error("Note trop longue (max 2000 caractères)");
      }
    }
  }

  const next: MaintenanceVisit = { ...cur, ...restPatch };
  if (clearSignature) {
    next.clientSignature = undefined;
  } else if (_sigPatch) {
    next.clientSignature = _sigPatch;
  }
  if (patch.status === "finalized" && !cur.finalizedAt) {
    next.finalizedAt = new Date().toISOString();
  } else if (patch.status === "draft") {
    next.finalizedAt = undefined;
  }
  next.updatedAt = new Date().toISOString();

  if (useSupabase()) {
    await sbUpdate(id, next);
    // Cache mémoire à jour pour cold-start consistency
    const mem = globalAny.__memoryMaintenanceVisits ?? [];
    const memIdx = mem.findIndex((v) => v.id === id);
    if (memIdx === -1) mem.push(next);
    else mem[memIdx] = next;
    globalAny.__memoryMaintenanceVisits = mem;
    return next;
  }

  all[idx] = next;
  await writeAll(all);
  return next;
}

export async function deleteVisit(id: string): Promise<boolean> {
  if (useSupabase()) {
    const ok = await sbDelete(id);
    if (ok) {
      const mem = globalAny.__memoryMaintenanceVisits ?? [];
      globalAny.__memoryMaintenanceVisits = mem.filter((v) => v.id !== id);
    }
    return ok;
  }
  const all = await readAll();
  const next = all.filter((v) => v.id !== id);
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}

/**
 * Upsert d'une visite complète. Utilisé comme fallback "self-healing" par le
 * front quand un PATCH renvoie 404 sur un cold-start Vercel : le client a
 * encore la visite en mémoire / sessionStorage et la repousse intégralement.
 *
 * Validation : leadReference + type obligatoires (sécurité contre les upserts
 * incomplets qui créeraient des rows orphelines).
 */
export async function upsertVisit(
  id: string,
  payload: Partial<MaintenanceVisit>,
): Promise<MaintenanceVisit> {
  if (!payload.leadReference) {
    throw new Error("leadReference requis pour upsert");
  }
  if (
    !payload.type ||
    !["entretien", "depannage", "pose", "diagnostic"].includes(payload.type)
  ) {
    throw new Error("type d'intervention requis et valide");
  }

  const now = new Date().toISOString();
  const merged: MaintenanceVisit = {
    id,
    contractId: payload.contractId,
    leadReference: payload.leadReference,
    equipmentId: payload.equipmentId,
    type: payload.type,
    visitedAt: payload.visitedAt ?? now,
    technicianEmail: payload.technicianEmail,
    durationMin: payload.durationMin,
    checklist: payload.checklist ?? [],
    measurements: payload.measurements ?? [],
    partsReplaced: payload.partsReplaced ?? [],
    recommendations: payload.recommendations,
    observations: payload.observations,
    interventionNotes: payload.interventionNotes,
    clientSignature: payload.clientSignature,
    status: payload.status === "finalized" ? "finalized" : "draft",
    finalizedAt:
      payload.status === "finalized" ? payload.finalizedAt ?? now : undefined,
    createdAt: payload.createdAt ?? now,
    updatedAt: now,
  };

  if (useSupabase()) {
    // PostgREST UPSERT via Prefer: resolution=merge-duplicates
    await fetch(sbRest("/maintenance_visits?on_conflict=id"), {
      method: "POST",
      headers: sbHeaders({
        Prefer: "resolution=merge-duplicates,return=representation",
      }),
      body: JSON.stringify(toDb(merged)),
    });
    // Cache mémoire à jour
    const mem = globalAny.__memoryMaintenanceVisits ?? [];
    const memIdx = mem.findIndex((v) => v.id === id);
    if (memIdx === -1) mem.push(merged);
    else mem[memIdx] = merged;
    globalAny.__memoryMaintenanceVisits = mem;
    return merged;
  }

  // File / memory path
  const all = await readAll();
  const idx = all.findIndex((v) => v.id === id);
  if (idx === -1) all.push(merged);
  else all[idx] = merged;
  await writeAll(all);
  return merged;
}
