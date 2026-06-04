/**
 * Next best action — règles déterministes qui suggèrent les prochaines actions
 * les plus pertinentes pour un lead donné.
 *
 * Pas de ML, pas d'AI. Juste un système de règles lisibles qui produit une
 * liste rankée d'actions actionnables. L'humain garde la décision finale.
 *
 * Conçu pour être stupidement transparent : chaque suggestion vient avec sa
 * raison (« Hot lead + SLA dépassé de 1h12 → appeler maintenant »).
 *
 * Pour étendre : ajouter une rule dans `rules` ci-dessous. Une rule retourne
 * un Action ou null si elle ne s'applique pas. Le ranking se fait sur
 * `priority` (1 = nice-to-have, 10 = urgentissime).
 */

import type { LeadRecord } from "./devis-schema";
import type { Reminder } from "./reminders-store";
import type { Quote } from "./quote-schema";
import { assessLeadSla } from "./sla-tracker";

export type NextAction = {
  id: string;
  type: "call" | "email" | "schedule" | "status" | "internal";
  title: string;
  reason: string;
  priority: number; // 1..10
  cta?: {
    href?: string;
    label: string;
  };
};

export type LeadContext = {
  lead: LeadRecord;
  reminders?: Reminder[]; // rappels actifs sur ce lead
  hasQuote?: boolean;
  quoteStatus?: Quote["status"]; // draft | sent | accepted | refused
  quoteSentAt?: string;
  commentCount?: number;
  hasDuplicates?: boolean;
  now?: number; // injectable pour tests
};

type Rule = (ctx: LeadContext) => NextAction | null;

const DAY_MS = 86_400_000;

/* ─────────────── Rules ─────────────── */

const ruleHotPendingSla: Rule = (ctx) => {
  const { lead } = ctx;
  if (lead.status !== "nouveau") return null;
  if (lead.level !== "hot") return null;
  const a = assessLeadSla(lead, ctx.now);
  if (a.status === "breach") {
    return {
      id: "hot-sla-breach",
      type: "call",
      title: "Appeler maintenant",
      reason: `Hot lead, SLA dépassé. Plus on attend, plus on perd.`,
      priority: 10,
      cta: { href: `tel:${lead.phone}`, label: `Appeler ${lead.phone}` },
    };
  }
  if (a.status === "warning") {
    return {
      id: "hot-sla-warning",
      type: "call",
      title: "Appeler vite",
      reason: `Hot lead, SLA proche. Le contact maintenant maximise la conversion.`,
      priority: 9,
      cta: { href: `tel:${lead.phone}`, label: `Appeler ${lead.phone}` },
    };
  }
  if (lead.timeline === "urgent") {
    return {
      id: "hot-urgent",
      type: "call",
      title: "Appeler — client urgent",
      reason: `Hot lead avec timeline "urgent". Cible prioritaire.`,
      priority: 8,
      cta: { href: `tel:${lead.phone}`, label: `Appeler ${lead.phone}` },
    };
  }
  return null;
};

const ruleNouveauNonContacte: Rule = (ctx) => {
  const { lead, now = Date.now() } = ctx;
  if (lead.status !== "nouveau") return null;
  const ageH = (now - new Date(lead.submittedAt).getTime()) / 3_600_000;
  if (ageH < 2) return null;
  return {
    id: "nouveau-aging",
    type: "email",
    title: "Envoyer email de premier contact",
    reason: `Lead en "nouveau" depuis ${Math.round(ageH)} h. Un premier accusé de réception même standard maintient l'engagement.`,
    priority: lead.level === "hot" ? 8 : lead.level === "warm" ? 6 : 4,
    cta: {
      href: `/admin/leads/${lead.reference}#templates`,
      label: "Choisir un template",
    },
  };
};

const ruleDevisSansRelance: Rule = (ctx) => {
  const { lead, hasQuote, quoteStatus, quoteSentAt, now = Date.now() } = ctx;
  if (!hasQuote) return null;
  if (lead.status !== "devis_envoye") return null;
  if (quoteStatus === "accepted" || quoteStatus === "refused") return null;
  if (!quoteSentAt) return null;
  const days = Math.floor((now - new Date(quoteSentAt).getTime()) / DAY_MS);
  if (days < 5) return null;
  return {
    id: "devis-relance",
    type: "email",
    title: "Relancer sur le devis",
    reason: `Devis envoyé il y a ${days} jours sans retour. Une relance courte et bien tournée double la chance de signature.`,
    priority: days >= 14 ? 8 : 6,
    cta: {
      href: `/admin/leads/${lead.reference}/quote`,
      label: "Ouvrir le devis",
    },
  };
};

const ruleQuoteAccepteAConvertir: Rule = (ctx) => {
  const { lead, hasQuote, quoteStatus } = ctx;
  if (!hasQuote) return null;
  if (quoteStatus !== "accepted") return null;
  if (lead.status === "converti") return null;
  return {
    id: "quote-accepted-convert",
    type: "status",
    title: "Marquer comme converti",
    reason: `Le client a accepté le devis officiellement. À passer en "converti" pour figer la conversion.`,
    priority: 9,
    cta: {
      href: `/admin/leads/${lead.reference}`,
      label: "Ouvrir la fiche",
    },
  };
};

const ruleNouveauNoReminder: Rule = (ctx) => {
  const { lead, reminders = [] } = ctx;
  if (lead.status !== "nouveau") return null;
  if (lead.level === "hot") return null; // hot → priorité au call direct
  if (reminders.some((r) => !r.firedAt && !r.dismissedAt)) return null;
  return {
    id: "schedule-followup",
    type: "schedule",
    title: "Programmer un rappel de relance",
    reason: `Pas de rappel actif. Un rappel à demain matin évite que le lead sorte du radar.`,
    priority: 3,
    cta: {
      href: `/admin/leads/${lead.reference}#reminders`,
      label: "Ajouter un rappel",
    },
  };
};

const ruleContacteSansSuite: Rule = (ctx) => {
  const { lead, now = Date.now() } = ctx;
  if (lead.status !== "contacte") return null;
  const history = lead.statusHistory ?? [];
  // Date passage en "contacte"
  let contactedAt: number | null = null;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].to === "contacte") {
      contactedAt = new Date(history[i].at).getTime();
      break;
    }
  }
  if (contactedAt === null) return null;
  const days = Math.floor((now - contactedAt) / DAY_MS);
  if (days < 3) return null;
  return {
    id: "contacte-aging",
    type: "email",
    title: "Envoyer le devis ou un récap",
    reason: `Statut "contacté" depuis ${days} jours sans progression. Soit on envoie un devis, soit on documente pourquoi ça stagne.`,
    priority: days >= 7 ? 7 : 5,
    cta: {
      href: `/admin/leads/${lead.reference}/quote`,
      label: "Composer un devis",
    },
  };
};

const ruleDoublonAVerifier: Rule = (ctx) => {
  if (!ctx.hasDuplicates) return null;
  return {
    id: "duplicate-review",
    type: "internal",
    title: "Vérifier les doublons détectés",
    reason: `Ce dossier partage email ou téléphone avec d'autres leads. Confirmer la stratégie de relance avant double contact.`,
    priority: 7,
    cta: {
      href: `/admin/duplicates`,
      label: "Ouvrir la revue doublons",
    },
  };
};

const ruleConvertiSansNps: Rule = (ctx) => {
  const { lead, now = Date.now() } = ctx;
  if (lead.status !== "converti") return null;
  const history = lead.statusHistory ?? [];
  let convertedAt: number | null = null;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].to === "converti") {
      convertedAt = new Date(history[i].at).getTime();
      break;
    }
  }
  if (convertedAt === null) return null;
  const days = (now - convertedAt) / DAY_MS;
  if (days < 7) return null;
  if (days > 30) return null; // au-delà, l'enquête perd son sens
  return {
    id: "send-nps",
    type: "email",
    title: "Envoyer l'enquête de satisfaction",
    reason: `Converti depuis ${Math.floor(days)} j. C'est le moment idéal pour mesurer la satisfaction à chaud.`,
    priority: 4,
    cta: { href: `/admin/nps`, label: "Ouvrir NPS" },
  };
};

const ruleNoCommentsSlowMoving: Rule = (ctx) => {
  const { lead, commentCount = 0, now = Date.now() } = ctx;
  if (lead.status !== "contacte" && lead.status !== "devis_envoye") return null;
  if (commentCount >= 1) return null;
  const ageH = (now - new Date(lead.submittedAt).getTime()) / 3_600_000;
  if (ageH < 48) return null;
  return {
    id: "document-context",
    type: "internal",
    title: "Documenter le dossier",
    reason: `Aucun commentaire interne sur un dossier de ${Math.floor(ageH / 24)} j. Un mot sur l'historique aide l'équipe (et le futur-vous).`,
    priority: 2,
    cta: {
      href: `/admin/leads/${lead.reference}#comments`,
      label: "Ajouter un commentaire",
    },
  };
};

const RULES: Rule[] = [
  ruleHotPendingSla,
  ruleQuoteAccepteAConvertir,
  ruleDevisSansRelance,
  ruleNouveauNonContacte,
  ruleContacteSansSuite,
  ruleDoublonAVerifier,
  ruleConvertiSansNps,
  ruleNouveauNoReminder,
  ruleNoCommentsSlowMoving,
];

/* ─────────────── Compute ─────────────── */

export function computeNextBestActions(ctx: LeadContext): NextAction[] {
  const out: NextAction[] = [];
  for (const rule of RULES) {
    const a = rule(ctx);
    if (a) out.push(a);
  }
  return out.sort((a, b) => b.priority - a.priority);
}
