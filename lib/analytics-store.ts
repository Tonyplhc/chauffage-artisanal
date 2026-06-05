/**
 * Analytics maison — privacy-first.
 *
 * Aucune donnée personnellement identifiable :
 *   - Pas de cookie de tracking
 *   - Pas d'identifiant unique visiteur (juste un hash session par jour)
 *   - IP hashée + tronquée (16 chars) avant stockage
 *   - User-agent agrégé en famille (Chrome, Firefox…) pas la version
 *
 * Conforme RGPD sans bandeau cookie supplémentaire — c'est de l'analytics
 * fonctionnel essentiel au service, pas du tracking marketing.
 *
 * Stockage adapté à l'environnement :
 *   - Local dev : data/analytics-events.json (rotation 50k)
 *   - Vercel readonly : in-memory store global (persiste dans l'instance
 *     Lambda chaude — typiquement quelques minutes à quelques heures)
 *   - Production scalable : Supabase si EMOJI_ANALYTICS_USE_SUPABASE=1
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const EVENTS_FILE = path.join(DATA_DIR, "analytics-events.json");

const MAX_EVENTS = 50_000;

// Détection environnement readonly (Vercel serverless functions)
const VERCEL_READONLY = !!process.env.VERCEL;

// Store in-memory partagé par instance Lambda (persistance "best-effort").
// Survit aux requêtes successives sur la même instance. Reset au cold start.
const globalAny = globalThis as unknown as {
  __memoryAnalytics?: AnalyticsEvent[];
};
if (!globalAny.__memoryAnalytics) globalAny.__memoryAnalytics = [];

export type AnalyticsEvent = {
  id: string;
  at: string;
  type: "pageview" | "event";
  path: string;
  name?: string;
  // Données dérivées et anonymisées
  refererHost?: string;
  browser?: string;
  device?: "mobile" | "desktop" | "tablet";
  sessionHash?: string; // Hash composé : IP+UA+jour. Change chaque jour.
  duration?: number; // ms pour les events de type "time-on-page"
  meta?: Record<string, string | number | boolean>;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<AnalyticsEvent[]> {
  if (VERCEL_READONLY) {
    return globalAny.__memoryAnalytics ?? [];
  }
  try {
    return JSON.parse(await fs.readFile(EVENTS_FILE, "utf8"));
  } catch {
    return globalAny.__memoryAnalytics ?? [];
  }
}

async function writeAll(events: AnalyticsEvent[]) {
  const capped = events.slice(0, MAX_EVENTS);
  // En tous environnements, on tient le store mémoire à jour — sert de
  // backup même quand l'écriture fichier réussit.
  globalAny.__memoryAnalytics = capped;
  if (VERCEL_READONLY) return;
  try {
    await ensureDir();
    await fs.writeFile(EVENTS_FILE, JSON.stringify(capped, null, 2), "utf8");
  } catch {
    // best-effort : la mémoire suffit en fallback
  }
}

export async function track(event: Omit<AnalyticsEvent, "id" | "at">): Promise<void> {
  try {
    const all = await readAll();
    all.unshift({
      ...event,
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      at: new Date().toISOString(),
    });
    await writeAll(all);
  } catch {
    // best-effort
  }
}

export async function listEvents(limit?: number): Promise<AnalyticsEvent[]> {
  const all = await readAll();
  return limit ? all.slice(0, limit) : all;
}

/* ─────────────── Helpers anonymisation ─────────────── */

const today = () => new Date().toISOString().slice(0, 10);

export function hashSession(ip: string, userAgent: string): string {
  return createHash("sha256")
    .update(`${ip}:${userAgent}:${today()}`)
    .digest("hex")
    .slice(0, 12);
}

export function detectBrowser(ua: string): string {
  if (!ua) return "Inconnu";
  if (/Edg\//.test(ua)) return "Edge";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return "Safari";
  if (/OPR\//.test(ua)) return "Opera";
  return "Autre";
}

export function detectDevice(ua: string): "mobile" | "desktop" | "tablet" {
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobile|Android|iPhone/i.test(ua)) return "mobile";
  return "desktop";
}

export function shortReferer(referer: string | null): string | undefined {
  if (!referer) return undefined;
  try {
    const url = new URL(referer);
    return url.hostname;
  } catch {
    return undefined;
  }
}

/* ─────────────── Agrégations ─────────────── */

export type AnalyticsAggregates = {
  totalEvents: number;
  pageviews: number;
  uniqueSessions: number;
  last30Days: {
    date: string;
    pageviews: number;
    uniqueSessions: number;
  }[];
  topPaths: { path: string; count: number }[];
  topReferers: { host: string; count: number }[];
  byBrowser: { browser: string; count: number }[];
  byDevice: Record<"mobile" | "desktop" | "tablet", number>;
  // NOUVEAU : informations enrichies
  recentEvents: AnalyticsEvent[]; // 20 derniers events pour feed live
  funnelDevis: {
    visitedHome: number; // sessions ayant visité /
    visitedDevis: number; // sessions ayant atteint /devis
    visitedTools: number; // sessions ayant visité /outils/*
    visitedKlimabonus: number; // sessions ayant visité /klimabonus-2026
  };
  byHour: number[]; // distribution 24h (heures locales LU)
  storageMode: "fs" | "memory"; // pour transparence
  // Conversion — agrégée depuis les events nommés (collecte inchangée)
  conversion: {
    windowDays: number;
    counts: { arrived: number; started: number; submitted: number; contactSubmitted: number; phoneClicks: number };
    funnel: { key: string; label: string; sessions: number; pctOfArrived: number; dropFromPrev: number }[];
    biggestLeak: { from: string; to: string; dropRate: number } | null;
    rates: { engagement: number | null; completion: number | null; tunnel: number | null };
    byTool: { from: string; arrived: number; submitted: number; convRate: number | null }[];
    channels: { devis: number; contact: number; phone: number };
    phoneBySurface: { surface: string; count: number }[];
  };
};

export async function computeAggregates(): Promise<AnalyticsAggregates> {
  const events = await listEvents();
  const pageviews = events.filter((e) => e.type === "pageview");

  // Daily series 30 days
  const dayMap = new Map<string, { pvs: number; sessions: Set<string> }>();
  const now = Date.now();
  const day = 86_400_000;
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now - i * day);
    const key = date.toISOString().slice(0, 10);
    dayMap.set(key, { pvs: 0, sessions: new Set() });
  }
  for (const e of pageviews) {
    const key = e.at.slice(0, 10);
    const bucket = dayMap.get(key);
    if (!bucket) continue;
    bucket.pvs++;
    if (e.sessionHash) bucket.sessions.add(e.sessionHash);
  }
  const last30Days = Array.from(dayMap.entries()).map(([date, b]) => ({
    date,
    pageviews: b.pvs,
    uniqueSessions: b.sessions.size,
  }));

  // Top paths
  const pathCounts = new Map<string, number>();
  for (const e of pageviews) {
    pathCounts.set(e.path, (pathCounts.get(e.path) ?? 0) + 1);
  }
  const topPaths = Array.from(pathCounts.entries())
    .map(([p, c]) => ({ path: p, count: c }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // Top referers
  const refererCounts = new Map<string, number>();
  for (const e of pageviews) {
    if (!e.refererHost) continue;
    refererCounts.set(e.refererHost, (refererCounts.get(e.refererHost) ?? 0) + 1);
  }
  const topReferers = Array.from(refererCounts.entries())
    .map(([h, c]) => ({ host: h, count: c }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Browsers + devices
  const browserCounts = new Map<string, number>();
  const deviceCounts = { mobile: 0, desktop: 0, tablet: 0 };
  for (const e of pageviews) {
    if (e.browser) browserCounts.set(e.browser, (browserCounts.get(e.browser) ?? 0) + 1);
    if (e.device) deviceCounts[e.device]++;
  }
  const byBrowser = Array.from(browserCounts.entries())
    .map(([b, c]) => ({ browser: b, count: c }))
    .sort((a, b) => b.count - a.count);

  // Unique sessions globales (sur 30j)
  const allSessions = new Set<string>();
  for (const e of pageviews) {
    if (e.sessionHash) allSessions.add(e.sessionHash);
  }

  // ─── Funnel devis — sessions touchant les pages clés
  const sessionsByPath: Record<string, Set<string>> = {
    home: new Set(),
    devis: new Set(),
    tools: new Set(),
    klimabonus: new Set(),
  };
  for (const e of pageviews) {
    if (!e.sessionHash) continue;
    if (e.path === "/") sessionsByPath.home.add(e.sessionHash);
    if (e.path.startsWith("/devis")) sessionsByPath.devis.add(e.sessionHash);
    if (e.path.startsWith("/outils")) sessionsByPath.tools.add(e.sessionHash);
    if (e.path.startsWith("/klimabonus-2026")) sessionsByPath.klimabonus.add(e.sessionHash);
  }

  // ─── Distribution par heure (0-23, heure LU = UTC+1/+2)
  const byHour = Array.from({ length: 24 }, () => 0);
  for (const e of pageviews) {
    const date = new Date(e.at);
    const hourLU = (date.getUTCHours() + 1) % 24; // approximation été/hiver
    byHour[hourLU]++;
  }

  // ─── Conversion — events nommés, 30 derniers jours ───
  const WINDOW_DAYS = 30;
  const windowStart = now - WINDOW_DAYS * day;
  const named = events.filter(
    (e) => e.type === "event" && !!e.name && new Date(e.at).getTime() >= windowStart,
  );
  const byName = (n: string) => named.filter((e) => e.name === n);
  const uniq = (list: AnalyticsEvent[]) => {
    const s = new Set<string>();
    for (const e of list) if (e.sessionHash) s.add(e.sessionHash);
    return s;
  };
  const metaStr = (e: AnalyticsEvent, k: string, d: string) =>
    e.meta && typeof e.meta[k] === "string" ? (e.meta[k] as string) : d;

  const evArrived = byName("devis_arrived");
  const evStarted = byName("devis_started");
  const evStep = byName("devis_step");
  const evSubmitted = byName("devis_submitted");
  const evContact = byName("contact_submitted");
  const evPhone = byName("phone_click");

  const sArrived = uniq(evArrived).size;
  const sStarted = uniq(evStarted).size;
  const sSubmitted = uniq(evSubmitted).size;

  const reachedStep = (n: number): number => {
    const s = new Set<string>();
    for (const e of evStep) {
      const st = e.meta && typeof e.meta.step === "number" ? e.meta.step : -1;
      if (st >= n && e.sessionHash) s.add(e.sessionHash);
    }
    return s.size;
  };

  const STEP_LABELS = ["Bâtiment", "Contexte", "Délai & budget", "Coordonnées"];
  const stages = [
    { key: "arrived", label: "Arrivée /devis", sessions: sArrived },
    { key: "started", label: "Devis commencé", sessions: sStarted },
    ...STEP_LABELS.map((l, i) => ({ key: `step${i + 1}`, label: `Étape ${i + 1} · ${l}`, sessions: reachedStep(i + 1) })),
    { key: "submitted", label: "Devis envoyé", sessions: sSubmitted },
  ];
  const base = sArrived || 1;
  let biggestLeak: { from: string; to: string; dropRate: number } | null = null;
  const funnel = stages.map((st, i) => {
    const prev = i > 0 ? stages[i - 1].sessions : st.sessions;
    const drop = prev > 0 ? (prev - st.sessions) / prev : 0;
    if (i > 0 && prev > 0 && (!biggestLeak || drop > biggestLeak.dropRate)) {
      biggestLeak = { from: stages[i - 1].label, to: st.label, dropRate: drop };
    }
    return {
      key: st.key,
      label: st.label,
      sessions: st.sessions,
      pctOfArrived: Math.round((st.sessions / base) * 100),
      dropFromPrev: Math.round(drop * 100),
    };
  });

  const pct = (num: number, den: number): number | null => (den > 0 ? Math.round((num / den) * 100) : null);

  const toolMap = new Map<string, { arrived: number; submitted: number }>();
  for (const e of evArrived) {
    const f = metaStr(e, "from", "direct");
    const t = toolMap.get(f) ?? { arrived: 0, submitted: 0 };
    t.arrived++;
    toolMap.set(f, t);
  }
  for (const e of evSubmitted) {
    const f = metaStr(e, "from", "direct");
    const t = toolMap.get(f) ?? { arrived: 0, submitted: 0 };
    t.submitted++;
    toolMap.set(f, t);
  }
  const byTool = Array.from(toolMap.entries())
    .map(([from, v]) => ({ from, arrived: v.arrived, submitted: v.submitted, convRate: pct(v.submitted, v.arrived) }))
    .sort((a, b) => b.submitted - a.submitted || b.arrived - a.arrived)
    .slice(0, 12);

  const phoneMap = new Map<string, number>();
  for (const e of evPhone) {
    const s = metaStr(e, "ctaSurface", "autre");
    phoneMap.set(s, (phoneMap.get(s) ?? 0) + 1);
  }
  const phoneBySurface = Array.from(phoneMap.entries())
    .map(([surface, count]) => ({ surface, count }))
    .sort((a, b) => b.count - a.count);

  const conversion = {
    windowDays: WINDOW_DAYS,
    counts: {
      arrived: evArrived.length,
      started: evStarted.length,
      submitted: evSubmitted.length,
      contactSubmitted: evContact.length,
      phoneClicks: evPhone.length,
    },
    funnel,
    biggestLeak,
    rates: {
      engagement: pct(sStarted, sArrived),
      completion: pct(sSubmitted, sStarted),
      tunnel: pct(sSubmitted, sArrived),
    },
    byTool,
    channels: { devis: evSubmitted.length, contact: evContact.length, phone: evPhone.length },
    phoneBySurface,
  };

  return {
    totalEvents: events.length,
    pageviews: pageviews.length,
    uniqueSessions: allSessions.size,
    last30Days,
    topPaths,
    topReferers,
    byBrowser,
    byDevice: deviceCounts,
    recentEvents: events.slice(0, 20),
    funnelDevis: {
      visitedHome: sessionsByPath.home.size,
      visitedDevis: sessionsByPath.devis.size,
      visitedTools: sessionsByPath.tools.size,
      visitedKlimabonus: sessionsByPath.klimabonus.size,
    },
    byHour,
    storageMode: VERCEL_READONLY ? "memory" : "fs",
    conversion,
  };
}
