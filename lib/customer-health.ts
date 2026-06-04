/**
 * Customer health score — santé d'un client post-conversion.
 *
 * Score 0-100 calculé à partir de plusieurs signaux pondérés :
 *   - NPS récent (positif/négatif)
 *   - Contrat entretien actif et non en retard
 *   - Paiements à temps (facturation)
 *   - Sentiment chat/commentaires (analyse rules-based W22.4)
 *   - Activité récente (ancienneté du dernier contact)
 *
 * Labels :
 *   75+ : excellent
 *   50-74 : healthy
 *   25-49 : at_risk
 *   <25 : critical
 */

import { listLeads, getLead } from "./leads-store";
import { listSurveys } from "./nps-store";
import { listContracts } from "./maintenance-contracts-store";
import { listInvoicesForLead } from "./invoices-store";
import { listCommentsForLead } from "./comments-store";
import { listConversations } from "./chat-store";
import { analyzeSentiment } from "./sentiment";
import type { LeadRecord } from "./devis-schema";

export type HealthLabel = "excellent" | "healthy" | "at_risk" | "critical";

export type HealthFactor = {
  label: string;
  delta: number; // +/- points sur le score
  reason: string;
};

export type HealthAssessment = {
  lead: {
    reference: string;
    fullName: string;
    email: string;
    convertedAt?: string;
  };
  score: number; // 0-100
  label: HealthLabel;
  factors: HealthFactor[];
};

function labelOf(score: number): HealthLabel {
  if (score >= 75) return "excellent";
  if (score >= 50) return "healthy";
  if (score >= 25) return "at_risk";
  return "critical";
}

function convertedAt(lead: LeadRecord): string | null {
  const history = lead.statusHistory ?? [];
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].to === "converti") return history[i].at;
  }
  return null;
}

export async function assessClient(
  reference: string,
): Promise<HealthAssessment | null> {
  const lead = await getLead(reference);
  if (!lead) return null;
  if (lead.status !== "converti") return null;

  let score = 50;
  const factors: HealthFactor[] = [];
  const now = Date.now();

  // Ancienneté de conversion
  const convAt = convertedAt(lead);
  if (convAt) {
    const ageDays = (now - new Date(convAt).getTime()) / 86_400_000;
    if (ageDays > 730) {
      score += 10;
      factors.push({
        label: "Client de longue date",
        delta: 10,
        reason: `Converti il y a ${Math.floor(ageDays / 365)} ans`,
      });
    }
  }

  // Contrat entretien
  const contracts = await listContracts({ leadReference: reference });
  const activeContract = contracts.find((c) => c.status === "active");
  if (activeContract) {
    const due = new Date(activeContract.nextDueAt).getTime();
    if (due > now) {
      score += 25;
      factors.push({
        label: "Contrat entretien actif",
        delta: 25,
        reason: `Prochaine visite ${new Date(activeContract.nextDueAt).toLocaleDateString("fr-FR")}`,
      });
    } else {
      score -= 10;
      factors.push({
        label: "Visite entretien en retard",
        delta: -10,
        reason: "Échéance contrat dépassée",
      });
    }
  } else {
    factors.push({
      label: "Pas de contrat entretien",
      delta: 0,
      reason: "Opportunité commerciale",
    });
  }

  // NPS récent
  const surveys = await listSurveys();
  const myNps = surveys
    .filter((s) => s.leadReference === reference && s.respondedAt && typeof s.score === "number")
    .sort((a, b) =>
      (b.respondedAt ?? "").localeCompare(a.respondedAt ?? ""),
    );
  if (myNps.length > 0) {
    const last = myNps[0];
    const s = last.score!;
    if (s >= 9) {
      score += 20;
      factors.push({
        label: "Promoteur NPS",
        delta: 20,
        reason: `Score ${s}/10`,
      });
    } else if (s >= 7) {
      score += 5;
      factors.push({
        label: "Passif NPS",
        delta: 5,
        reason: `Score ${s}/10`,
      });
    } else {
      score -= 25;
      factors.push({
        label: "Détracteur NPS",
        delta: -25,
        reason: `Score ${s}/10`,
      });
    }
  }

  // Sentiment commentaires / chat
  const comments = await listCommentsForLead(reference);
  const negativeComments = comments
    .filter((c) => !c.deletedAt)
    .map((c) => analyzeSentiment(c.body))
    .filter((s) => s.label === "negative").length;
  if (negativeComments > 0) {
    const delta = Math.min(15, negativeComments * 5);
    score -= delta;
    factors.push({
      label: "Commentaires négatifs",
      delta: -delta,
      reason: `${negativeComments} message${negativeComments > 1 ? "s" : ""} flaggé${negativeComments > 1 ? "s" : ""}`,
    });
  }
  // Chat
  const conversations = await listConversations();
  const myConvs = conversations.filter(
    (c) =>
      (c.visitorEmail ?? "").toLowerCase() === lead.email.toLowerCase(),
  );
  let chatNegative = 0;
  for (const conv of myConvs) {
    for (const m of conv.messages) {
      if (m.sender !== "visitor") continue;
      if (analyzeSentiment(m.text).label === "negative") chatNegative += 1;
    }
  }
  if (chatNegative > 0) {
    const delta = Math.min(10, chatNegative * 3);
    score -= delta;
    factors.push({
      label: "Messages chat négatifs",
      delta: -delta,
      reason: `${chatNegative} message${chatNegative > 1 ? "s" : ""}`,
    });
  }

  // Paiements (en retard ?)
  const invoices = await listInvoicesForLead(reference);
  const overdue = invoices.filter((i) => {
    if (i.status !== "sent") return false;
    if (!i.dueDate) return false;
    return new Date(i.dueDate).getTime() < now;
  }).length;
  if (overdue > 0) {
    const delta = Math.min(15, overdue * 7);
    score -= delta;
    factors.push({
      label: "Factures en retard",
      delta: -delta,
      reason: `${overdue} facture${overdue > 1 ? "s" : ""} dépassée${overdue > 1 ? "s" : ""}`,
    });
  } else if (invoices.filter((i) => i.status === "paid").length > 0) {
    score += 5;
    factors.push({
      label: "Paiements à jour",
      delta: 5,
      reason: "Bon historique paiement",
    });
  }

  // Clamp + label
  score = Math.max(0, Math.min(100, score));
  return {
    lead: {
      reference: lead.reference,
      fullName: lead.fullName,
      email: lead.email,
      convertedAt: convAt ?? undefined,
    },
    score,
    label: labelOf(score),
    factors: factors.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)),
  };
}

export async function assessAllClients(): Promise<HealthAssessment[]> {
  const leads = await listLeads();
  const converted = leads.filter((l) => l.status === "converti");
  const out: HealthAssessment[] = [];
  for (const l of converted) {
    const a = await assessClient(l.reference);
    if (a) out.push(a);
  }
  return out.sort((a, b) => a.score - b.score); // pires en haut
}

export type HealthStats = {
  total: number;
  excellent: number;
  healthy: number;
  atRisk: number;
  critical: number;
  averageScore: number;
};

export async function computeStats(): Promise<HealthStats> {
  const assessments = await assessAllClients();
  const stats: HealthStats = {
    total: assessments.length,
    excellent: 0,
    healthy: 0,
    atRisk: 0,
    critical: 0,
    averageScore: 0,
  };
  let sum = 0;
  for (const a of assessments) {
    sum += a.score;
    if (a.label === "excellent") stats.excellent += 1;
    else if (a.label === "healthy") stats.healthy += 1;
    else if (a.label === "at_risk") stats.atRisk += 1;
    else stats.critical += 1;
  }
  stats.averageScore =
    assessments.length === 0 ? 0 : Math.round(sum / assessments.length);
  return stats;
}
