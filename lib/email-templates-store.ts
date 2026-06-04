/**
 * Store des templates email éditables côté admin.
 *
 * Persistance : data/email-templates.json en dev, table `email_templates` à
 * brancher sur Supabase en prod (même pattern que catalogue-store).
 *
 * Variables supportées dans les templates :
 *   {{reference}}    — référence du lead (ex: DEV-2026-1234)
 *   {{firstName}}    — premier mot de fullName
 *   {{fullName}}     — nom complet
 *   {{services}}     — libellés concaténés des services
 *   {{commune}}      — commune
 *   {{recapUrl}}     — URL récap public
 *   {{espaceUrl}}    — URL espace client
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";

const DATA_DIR = path.join(process.cwd(), "data");
const TEMPLATES_FILE = path.join(DATA_DIR, "email-templates.json");

export const EmailTemplateSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(2).max(120),
  subject: z.string().min(2).max(200),
  body: z.string().min(10).max(20000),
  updatedAt: z.string().optional(),
});

export type EmailTemplate = z.infer<typeof EmailTemplateSchema>;

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: "first-contact",
    name: "1er contact — accusé de réception personnalisé",
    subject: "Votre projet {{reference}} · prochaine étape",
    body:
      "Bonjour {{firstName}},\n\n" +
      "Merci pour votre demande {{reference}} concernant {{services}}. Notre bureau d'études commence l'analyse de votre dossier.\n\n" +
      "Voici la prochaine étape proposée : un échange téléphonique de 15 minutes pour qualifier votre projet et organiser une visite technique gratuite.\n\n" +
      "Je vous contacte personnellement dans la journée pour fixer un créneau qui vous convient.\n\n" +
      "Vous pouvez aussi suivre l'avancement ici : {{espaceUrl}}\n\n" +
      "À très vite,\n" +
      "— Chauffage Artisanal",
  },
  {
    id: "devis-followup",
    name: "Relance après envoi de devis",
    subject: "{{reference}} · un point sur votre devis ?",
    body:
      "Bonjour {{firstName}},\n\n" +
      "Je reviens vers vous concernant le devis envoyé pour votre projet {{services}} à {{commune}} (référence {{reference}}).\n\n" +
      "Avez-vous eu l'occasion de le parcourir ? Je suis disponible pour répondre à toute question, ou pour ajuster certaines lignes selon vos contraintes.\n\n" +
      "Bonne journée,\n" +
      "— Chauffage Artisanal",
  },
  {
    id: "visit-confirmed",
    name: "Confirmation de visite technique",
    subject: "Visite technique confirmée · {{reference}}",
    body:
      "Bonjour {{firstName}},\n\n" +
      "Je vous confirme la visite technique pour votre projet {{services}}.\n\n" +
      "Nous arriverons à l'heure convenue, comptez environ 45-60 minutes sur place. Pensez à préparer si possible :\n" +
      "  - Les factures énergie des 12 derniers mois\n" +
      "  - Les plans du logement si vous les avez\n" +
      "  - Vos questions et contraintes éventuelles\n\n" +
      "À très bientôt,\n" +
      "— Chauffage Artisanal",
  },
];

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

export async function listTemplates(): Promise<EmailTemplate[]> {
  try {
    const raw = await fs.readFile(TEMPLATES_FILE, "utf8");
    return JSON.parse(raw) as EmailTemplate[];
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

export async function getTemplate(id: string): Promise<EmailTemplate | undefined> {
  const all = await listTemplates();
  return all.find((t) => t.id === id);
}

export async function upsertTemplate(t: EmailTemplate): Promise<void> {
  const all = await listTemplates();
  const idx = all.findIndex((x) => x.id === t.id);
  const next: EmailTemplate = { ...t, updatedAt: new Date().toISOString() };
  if (idx === -1) all.push(next);
  else all[idx] = next;
  await ensureDir();
  await fs.writeFile(TEMPLATES_FILE, JSON.stringify(all, null, 2), "utf8");
}

export async function deleteTemplate(id: string): Promise<void> {
  const all = await listTemplates();
  const filtered = all.filter((x) => x.id !== id);
  await ensureDir();
  await fs.writeFile(TEMPLATES_FILE, JSON.stringify(filtered, null, 2), "utf8");
}

/* ──────────────── Rendu (substitution variables) ──────────────── */

import type { LeadRecord } from "./devis-schema";
import { SERVICE_LABELS } from "./devis-schema";
import { makeRecapToken } from "./recap-token";

export function renderTemplate(
  tpl: Pick<EmailTemplate, "subject" | "body">,
  lead: LeadRecord,
): { subject: string; body: string } {
  const baseUrl = process.env.PUBLIC_URL?.replace(/\/$/, "") ?? "http://localhost:3020";
  const token = makeRecapToken(lead.reference);
  const vars: Record<string, string> = {
    reference: lead.reference,
    firstName: lead.fullName.split(" ")[0] ?? "",
    fullName: lead.fullName,
    services: lead.services.map((s) => SERVICE_LABELS[s]).join(" · "),
    commune: lead.commune,
    recapUrl: `${baseUrl}/devis/recap/${encodeURIComponent(lead.reference)}?t=${token}`,
    espaceUrl: `${baseUrl}/espace/${encodeURIComponent(lead.reference)}?t=${token}`,
  };
  const substitute = (s: string) =>
    s.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
  return {
    subject: substitute(tpl.subject),
    body: substitute(tpl.body),
  };
}

export const TEMPLATE_VARIABLES: { key: string; description: string }[] = [
  { key: "reference", description: "Référence du dossier (DEV-2026-XXXX)" },
  { key: "firstName", description: "Prénom du client" },
  { key: "fullName", description: "Nom complet du client" },
  { key: "services", description: "Services concernés, séparés par ·" },
  { key: "commune", description: "Commune du projet" },
  { key: "recapUrl", description: "Lien vers le récap imprimable" },
  { key: "espaceUrl", description: "Lien vers l'espace client de suivi" },
];
