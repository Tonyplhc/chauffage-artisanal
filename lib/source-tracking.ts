/**
 * Capture et analyse des sources d'acquisition (UTM + referrer + landing).
 *
 * Côté client : à l'arrivée sur une page, on lit window.location.search +
 * document.referrer et on persiste en sessionStorage. Si le visiteur navigue
 * sur le site puis arrive sur /devis, la source d'origine reste capturée.
 *
 * Côté serveur : on stocke dans `lead.metadata.source`. Statistiques :
 * agrégation par utmSource × statut pour calculer la conversion par canal.
 */

import type { LeadRecord } from "./devis-schema";

export type LeadSource = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
  landing?: string;
  capturedAt?: string;
};

/* ─────────────── Client-side utils ─────────────── */

const SS_KEY = "ca-lead-source";

export function captureSourceFromUrl(url: string, referrer: string): LeadSource {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return {};
  }
  const get = (k: string) => u.searchParams.get(k) ?? undefined;
  // Si on est dans un domaine externe, on enregistre comme referrer
  let ref: string | undefined;
  if (referrer && referrer.trim()) {
    try {
      const rUrl = new URL(referrer);
      if (rUrl.host && rUrl.host !== u.host) {
        ref = `${rUrl.host}${rUrl.pathname === "/" ? "" : rUrl.pathname}`;
      }
    } catch {
      // referrer non parsable — on prend brut
      ref = referrer.slice(0, 200);
    }
  }
  const source: LeadSource = {
    utmSource: get("utm_source"),
    utmMedium: get("utm_medium"),
    utmCampaign: get("utm_campaign"),
    utmContent: get("utm_content"),
    utmTerm: get("utm_term"),
    referrer: ref,
    landing: `${u.pathname}${u.search}`.slice(0, 300),
    capturedAt: new Date().toISOString(),
  };
  return source;
}

export function persistSourceClient(source: LeadSource) {
  if (typeof window === "undefined") return;
  try {
    const existing = window.sessionStorage.getItem(SS_KEY);
    if (existing) return; // déjà capturé pour cette session
    window.sessionStorage.setItem(SS_KEY, JSON.stringify(source));
  } catch {
    // ignore
  }
}

export function readSourceClient(): LeadSource | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LeadSource;
  } catch {
    return null;
  }
}

/** Helper appelable une fois au mount des pages publiques. */
export function captureAndStoreSource() {
  if (typeof window === "undefined") return;
  const source = captureSourceFromUrl(window.location.href, document.referrer);
  // On ne persiste que si on a au moins un signal utile
  if (
    source.utmSource ||
    source.utmCampaign ||
    source.utmMedium ||
    source.referrer
  ) {
    persistSourceClient(source);
  } else if (!readSourceClient()) {
    // Pas de signal mais on garde quand même la landing pour 1ère visite
    persistSourceClient(source);
  }
}

/* ─────────────── Server-side stats ─────────────── */

function extractSource(lead: LeadRecord): LeadSource | null {
  const meta = lead.metadata as { source?: LeadSource } | undefined;
  return meta?.source ?? null;
}

/** Label lisible pour grouper un lead par source. */
export function sourceLabel(lead: LeadRecord): string {
  const s = extractSource(lead);
  if (!s) return "Direct";
  if (s.utmSource) {
    return s.utmSource;
  }
  if (s.referrer) {
    return s.referrer;
  }
  return "Direct";
}

export type SourceStats = {
  bySource: {
    source: string;
    medium?: string;
    leads: number;
    hot: number;
    converted: number;
    lost: number;
    conversionRate: number; // converted / decided
  }[];
  byCampaign: {
    campaign: string;
    leads: number;
    converted: number;
    conversionRate: number;
  }[];
  topReferrers: { referrer: string; count: number }[];
  total: number;
};

export function computeSourceStats(leads: LeadRecord[]): SourceStats {
  const sourceMap = new Map<
    string,
    {
      source: string;
      medium?: string;
      leads: number;
      hot: number;
      converted: number;
      lost: number;
    }
  >();
  const campaignMap = new Map<
    string,
    { campaign: string; leads: number; converted: number }
  >();
  const referrerMap = new Map<string, number>();

  for (const lead of leads) {
    const src = extractSource(lead);
    const key = src?.utmSource?.toLowerCase() ?? "direct";
    const medium = src?.utmMedium;
    if (!sourceMap.has(key)) {
      sourceMap.set(key, {
        source: src?.utmSource ?? "Direct",
        medium,
        leads: 0,
        hot: 0,
        converted: 0,
        lost: 0,
      });
    }
    const bucket = sourceMap.get(key)!;
    bucket.leads += 1;
    if (lead.level === "hot") bucket.hot += 1;
    if (lead.status === "converti") bucket.converted += 1;
    if (lead.status === "perdu") bucket.lost += 1;

    if (src?.utmCampaign) {
      const c = src.utmCampaign;
      if (!campaignMap.has(c))
        campaignMap.set(c, { campaign: c, leads: 0, converted: 0 });
      const b = campaignMap.get(c)!;
      b.leads += 1;
      if (lead.status === "converti") b.converted += 1;
    }

    if (src?.referrer) {
      referrerMap.set(src.referrer, (referrerMap.get(src.referrer) ?? 0) + 1);
    }
  }

  const bySource = [...sourceMap.values()]
    .map((b) => ({
      ...b,
      conversionRate:
        b.converted + b.lost === 0 ? 0 : b.converted / (b.converted + b.lost),
    }))
    .sort((a, b) => b.leads - a.leads);
  const byCampaign = [...campaignMap.values()]
    .map((b) => ({
      ...b,
      conversionRate: b.leads === 0 ? 0 : b.converted / b.leads,
    }))
    .sort((a, b) => b.leads - a.leads);
  const topReferrers = [...referrerMap.entries()]
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return { bySource, byCampaign, topReferrers, total: leads.length };
}
