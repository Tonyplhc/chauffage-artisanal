/**
 * Signatures email par utilisateur admin.
 *
 * Stockage simple keyed par email. Une signature contient :
 *   - html : version HTML (rendue dans les emails HTML)
 *   - text : version texte brut (fallback dans les emails texte)
 *   - includeInTemplates : auto-append dans les emails de templates
 *   - includeInCampaigns : auto-append dans les newsletters/campagnes
 *
 * Helper `appendSignature(html, userEmail)` à appeler avant envoi côté
 * templates/campagnes — non-bloquant si pas de signature configurée.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const SIGNATURES_FILE = path.join(DATA_DIR, "email-signatures.json");

export type EmailSignature = {
  userEmail: string;
  html: string;
  text: string;
  includeInTemplates: boolean;
  includeInCampaigns: boolean;
  updatedAt: string;
};

const DEFAULT_SIGNATURE: Omit<EmailSignature, "userEmail" | "updatedAt"> = {
  html: "",
  text: "",
  includeInTemplates: true,
  includeInCampaigns: true,
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<EmailSignature[]> {
  try {
    return JSON.parse(await fs.readFile(SIGNATURES_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(arr: EmailSignature[]) {
  await ensureDir();
  await fs.writeFile(SIGNATURES_FILE, JSON.stringify(arr, null, 2), "utf8");
}

export async function getSignature(
  userEmail: string,
): Promise<EmailSignature | null> {
  const all = await readAll();
  const target = userEmail.toLowerCase();
  return all.find((s) => s.userEmail.toLowerCase() === target) ?? null;
}

export async function upsertSignature(
  userEmail: string,
  patch: Partial<Omit<EmailSignature, "userEmail" | "updatedAt">>,
): Promise<EmailSignature> {
  const all = await readAll();
  const target = userEmail.toLowerCase();
  const idx = all.findIndex((s) => s.userEmail.toLowerCase() === target);
  const now = new Date().toISOString();
  if (idx === -1) {
    const sig: EmailSignature = {
      userEmail,
      ...DEFAULT_SIGNATURE,
      ...patch,
      updatedAt: now,
    };
    if (sig.html.length > 8000) throw new Error("HTML trop long (max 8000)");
    if (sig.text.length > 4000) throw new Error("Texte trop long (max 4000)");
    all.push(sig);
    await writeAll(all);
    return sig;
  }
  const next: EmailSignature = { ...all[idx], ...patch, updatedAt: now };
  if (next.html.length > 8000) throw new Error("HTML trop long (max 8000)");
  if (next.text.length > 4000) throw new Error("Texte trop long (max 4000)");
  all[idx] = next;
  await writeAll(all);
  return next;
}

export async function deleteSignature(userEmail: string): Promise<boolean> {
  const all = await readAll();
  const target = userEmail.toLowerCase();
  const next = all.filter((s) => s.userEmail.toLowerCase() !== target);
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}

/* ─────────────── Helpers d'application ─────────────── */

/**
 * Ajoute la signature HTML à un email HTML existant, juste avant </body>.
 * Idempotent : si la signature contient déjà un marker `data-signature-of`,
 * on ne ré-ajoute pas.
 */
export async function appendHtmlSignature(
  html: string,
  userEmail: string,
  context: "template" | "campaign",
): Promise<string> {
  const sig = await getSignature(userEmail);
  if (!sig) return html;
  if (context === "template" && !sig.includeInTemplates) return html;
  if (context === "campaign" && !sig.includeInCampaigns) return html;
  if (!sig.html.trim()) return html;
  const marker = `data-signature-of="${userEmail.toLowerCase()}"`;
  if (html.includes(marker)) return html;
  const block = `<div ${marker} style="margin-top:28px;padding-top:16px;border-top:1px solid rgba(42,37,30,0.1);font-size:13px;color:#4a4338;font-family:inherit;">${sig.html}</div>`;
  if (html.includes("</body>")) {
    return html.replace("</body>", `${block}</body>`);
  }
  return `${html}${block}`;
}

export async function appendTextSignature(
  text: string,
  userEmail: string,
  context: "template" | "campaign",
): Promise<string> {
  const sig = await getSignature(userEmail);
  if (!sig) return text;
  if (context === "template" && !sig.includeInTemplates) return text;
  if (context === "campaign" && !sig.includeInCampaigns) return text;
  if (!sig.text.trim()) return text;
  if (text.includes(sig.text)) return text;
  return `${text}\n\n--\n${sig.text}`;
}
