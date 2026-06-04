/**
 * Checklists Health & Safety préalables à intervention.
 *
 * Templates hardcodés (gaz, hauteur, frigorigène, électrique). Le technicien
 * remplit une "completion" sur place avant de démarrer le chantier — traçabilité
 * de conformité.
 *
 * Pas de blocage : une completion avec items critiques en KO est juste
 * flaggée — l'admin décide d'aller au chantier ou pas. La responsabilité reste
 * humaine.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const COMPLETIONS_FILE = path.join(DATA_DIR, "safety-completions.json");

export type Severity = "info" | "warn" | "critical";

export type ChecklistTemplateItem = {
  key: string;
  label: string;
  severity: Severity;
};

export type ChecklistTemplate = {
  id: string;
  name: string;
  category: string;
  description: string;
  items: ChecklistTemplateItem[];
  version: number;
};

export const TEMPLATES: ChecklistTemplate[] = [
  {
    id: "gas-work",
    name: "Intervention gaz",
    category: "Gaz",
    description:
      "Vérifications obligatoires avant intervention sur installation gaz.",
    version: 1,
    items: [
      {
        key: "shutoff",
        label: "Vanne d'arrivée gaz identifiée et accessible",
        severity: "critical",
      },
      {
        key: "ventilation",
        label: "Ventilation du local conforme",
        severity: "critical",
      },
      {
        key: "leak_detector",
        label: "Détecteur de fuite gaz disponible et testé",
        severity: "critical",
      },
      {
        key: "no_flame",
        label: "Aucune flamme nue à proximité",
        severity: "critical",
      },
      {
        key: "extinguisher",
        label: "Extincteur à portée",
        severity: "warn",
      },
      {
        key: "permit",
        label: "Habilitation technicien valide (PGN/PG)",
        severity: "critical",
      },
    ],
  },
  {
    id: "height-work",
    name: "Travaux en hauteur",
    category: "Hauteur",
    description: "Préparation chantier en hauteur (toiture, échafaudage…).",
    version: 1,
    items: [
      {
        key: "epi",
        label: "EPI complets (harnais, casque, chaussures)",
        severity: "critical",
      },
      {
        key: "harness_check",
        label: "Harnais inspecté visuellement (date conforme)",
        severity: "critical",
      },
      {
        key: "anchor",
        label: "Point d'ancrage identifié et certifié",
        severity: "critical",
      },
      {
        key: "scaffold",
        label: "Échafaudage / nacelle conforme",
        severity: "warn",
      },
      {
        key: "weather",
        label: "Conditions météo acceptables (vent, sol mouillé)",
        severity: "warn",
      },
      {
        key: "buddy",
        label: "Pas seul sur site — collègue présent",
        severity: "warn",
      },
    ],
  },
  {
    id: "refrigerant",
    name: "Manipulation fluide frigorigène",
    category: "Frigorigène",
    description: "Préparation intervention sur circuit frigorifique PAC/clim.",
    version: 1,
    items: [
      {
        key: "cat1",
        label: "Attestation catégorie I valide (technicien)",
        severity: "critical",
      },
      {
        key: "company_cert",
        label: "Attestation entreprise valide",
        severity: "critical",
      },
      {
        key: "recovery",
        label: "Station de récupération opérationnelle",
        severity: "critical",
      },
      {
        key: "container",
        label: "Bouteille de récupération identifiée et pesée",
        severity: "warn",
      },
      {
        key: "leak_check",
        label: "Détecteur de fuite frigorigène testé",
        severity: "warn",
      },
      {
        key: "epi",
        label: "EPI (gants cryogéniques, lunettes)",
        severity: "warn",
      },
    ],
  },
  {
    id: "electrical",
    name: "Travaux électriques",
    category: "Électrique",
    description: "Avant intervention électrique (raccordement, dépannage).",
    version: 1,
    items: [
      {
        key: "habilitation",
        label: "Habilitation électrique en cours de validité",
        severity: "critical",
      },
      {
        key: "consignation",
        label: "Consignation effectuée (VAT validation)",
        severity: "critical",
      },
      {
        key: "epi",
        label: "EPI (gants isolants, chaussures, écran facial)",
        severity: "critical",
      },
      {
        key: "tools",
        label: "Outils isolés contrôlés",
        severity: "warn",
      },
      {
        key: "schema",
        label: "Schéma installation disponible",
        severity: "info",
      },
    ],
  },
];

/* ─────────────── Completions ─────────────── */

export type CompletionStatus = "ok" | "ko" | "na";

export type CompletionResult = {
  key: string;
  status: CompletionStatus;
  comment?: string;
};

export type SafetyCompletion = {
  id: string;
  templateId: string;
  leadReference?: string;
  slotId?: string;
  technicianEmail: string;
  results: CompletionResult[];
  notes?: string;
  signedAt?: string;
  signedBy?: string;
  createdAt: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readCompletions(): Promise<SafetyCompletion[]> {
  try {
    return JSON.parse(await fs.readFile(COMPLETIONS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeCompletions(arr: SafetyCompletion[]) {
  await ensureDir();
  await fs.writeFile(COMPLETIONS_FILE, JSON.stringify(arr, null, 2), "utf8");
}

function makeId(): string {
  return `sc-${randomBytes(5).toString("hex")}`;
}

export function getTemplate(id: string): ChecklistTemplate | null {
  return TEMPLATES.find((t) => t.id === id) ?? null;
}

export async function listCompletions(opts: {
  leadReference?: string;
  technicianEmail?: string;
  limit?: number;
} = {}): Promise<SafetyCompletion[]> {
  const all = await readCompletions();
  let out = all;
  if (opts.leadReference)
    out = out.filter((c) => c.leadReference === opts.leadReference);
  if (opts.technicianEmail)
    out = out.filter(
      (c) =>
        c.technicianEmail.toLowerCase() ===
        opts.technicianEmail!.toLowerCase(),
    );
  out = [...out].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (opts.limit) out = out.slice(0, opts.limit);
  return out;
}

export async function getCompletion(id: string): Promise<SafetyCompletion | null> {
  const all = await readCompletions();
  return all.find((c) => c.id === id) ?? null;
}

export async function createCompletion(input: {
  templateId: string;
  leadReference?: string;
  slotId?: string;
  technicianEmail: string;
}): Promise<SafetyCompletion> {
  const template = getTemplate(input.templateId);
  if (!template) throw new Error("Template inconnu");
  if (!input.technicianEmail?.trim()) throw new Error("Technicien requis");
  const completion: SafetyCompletion = {
    id: makeId(),
    templateId: input.templateId,
    leadReference: input.leadReference,
    slotId: input.slotId,
    technicianEmail: input.technicianEmail.trim().toLowerCase(),
    results: template.items.map((i) => ({ key: i.key, status: "na" })),
    createdAt: new Date().toISOString(),
  };
  const all = await readCompletions();
  all.push(completion);
  await writeCompletions(all);
  return completion;
}

export async function updateCompletion(
  id: string,
  patch: Partial<
    Pick<SafetyCompletion, "results" | "notes" | "signedAt" | "signedBy">
  >,
): Promise<SafetyCompletion | null> {
  const all = await readCompletions();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch };
  await writeCompletions(all);
  return all[idx];
}

export async function deleteCompletion(id: string): Promise<boolean> {
  const all = await readCompletions();
  const next = all.filter((c) => c.id !== id);
  if (next.length === all.length) return false;
  await writeCompletions(next);
  return true;
}

/** Helper : retourne true si tous les items critiques sont OK. */
export function isCompletionPassing(
  template: ChecklistTemplate,
  completion: SafetyCompletion,
): boolean {
  for (const item of template.items) {
    if (item.severity !== "critical") continue;
    const result = completion.results.find((r) => r.key === item.key);
    if (!result || result.status !== "ok") return false;
  }
  return true;
}
