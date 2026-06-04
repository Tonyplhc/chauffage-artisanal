/**
 * Programme de parrainage — un lead converti devient parrain et obtient un
 * lien public personnel à partager. Chaque visiteur arrivant via ce lien
 * est tracké, et s'il soumet un devis le lien est conservé en metadata
 * pour qu'on retrouve son parrain au moment de l'attribution.
 *
 * Pas de récompense automatique — c'est à l'admin de décider quoi offrir
 * (geste commercial, bon d'achat…) une fois la conversion confirmée.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { listLeads, getLead } from "./leads-store";
import type { LeadRecord } from "./devis-schema";

const DATA_DIR = path.join(process.cwd(), "data");
const REFERRALS_FILE = path.join(DATA_DIR, "referrals.json");

export type ReferralStats = {
  referrerRef: string;
  clickCount: number;
  createdAt: string;
  lastClickAt?: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<ReferralStats[]> {
  try {
    return JSON.parse(await fs.readFile(REFERRALS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(arr: ReferralStats[]) {
  await ensureDir();
  await fs.writeFile(REFERRALS_FILE, JSON.stringify(arr, null, 2), "utf8");
}

export async function ensureReferralEntry(
  referrerRef: string,
): Promise<ReferralStats> {
  const all = await readAll();
  let entry = all.find((r) => r.referrerRef === referrerRef);
  if (!entry) {
    entry = {
      referrerRef,
      clickCount: 0,
      createdAt: new Date().toISOString(),
    };
    all.push(entry);
    await writeAll(all);
  }
  return entry;
}

export async function recordClick(referrerRef: string): Promise<void> {
  const all = await readAll();
  let entry = all.find((r) => r.referrerRef === referrerRef);
  if (!entry) {
    entry = {
      referrerRef,
      clickCount: 0,
      createdAt: new Date().toISOString(),
    };
    all.push(entry);
  }
  entry.clickCount += 1;
  entry.lastClickAt = new Date().toISOString();
  await writeAll(all);
}

/* ─────────────── Lookup helpers ─────────────── */

function extractReferralToken(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const meta = metadata as { source?: { utmSource?: string; utmCampaign?: string }; referralToken?: string };
  if (typeof meta.referralToken === "string") return meta.referralToken;
  // Compat : si on a stocké le ref dans utm_source au format "ref:DEV-XXXX"
  const s = meta.source?.utmSource;
  if (typeof s === "string" && s.startsWith("ref:")) return s.slice(4);
  return null;
}

export type ReferralSummary = {
  referrer: LeadRecord;
  stats: ReferralStats;
  broughtLeads: LeadRecord[];
  convertedBrought: number;
};

export async function listReferralSummaries(): Promise<ReferralSummary[]> {
  const [stats, leads] = await Promise.all([readAll(), listLeads()]);
  const byRef = new Map(leads.map((l) => [l.reference, l]));
  const out: ReferralSummary[] = [];

  // Tous les parrains potentiels : leads convertis OU déjà présents dans stats
  const potentialReferrers = new Set<string>(
    leads.filter((l) => l.status === "converti").map((l) => l.reference),
  );
  for (const s of stats) potentialReferrers.add(s.referrerRef);

  for (const ref of potentialReferrers) {
    const referrer = byRef.get(ref);
    if (!referrer) continue;
    const entry =
      stats.find((s) => s.referrerRef === ref) ?? {
        referrerRef: ref,
        clickCount: 0,
        createdAt: referrer.submittedAt,
      };

    // Leads amenés par ce parrain : ceux qui ont referralToken = ref dans leur metadata
    const brought = leads.filter(
      (l) => extractReferralToken(l.metadata) === ref,
    );
    out.push({
      referrer,
      stats: entry,
      broughtLeads: brought,
      convertedBrought: brought.filter((l) => l.status === "converti").length,
    });
  }

  // Tri : par leads amenés desc, puis clicks desc
  out.sort((a, b) => {
    if (b.broughtLeads.length !== a.broughtLeads.length)
      return b.broughtLeads.length - a.broughtLeads.length;
    return b.stats.clickCount - a.stats.clickCount;
  });
  return out;
}

export async function getReferralDetailFor(
  referrerRef: string,
): Promise<ReferralSummary | null> {
  const referrer = await getLead(referrerRef);
  if (!referrer) return null;
  const [stats, leads] = await Promise.all([readAll(), listLeads()]);
  const entry =
    stats.find((s) => s.referrerRef === referrerRef) ?? {
      referrerRef,
      clickCount: 0,
      createdAt: referrer.submittedAt,
    };
  const brought = leads.filter(
    (l) => extractReferralToken(l.metadata) === referrerRef,
  );
  return {
    referrer,
    stats: entry,
    broughtLeads: brought,
    convertedBrought: brought.filter((l) => l.status === "converti").length,
  };
}
