/**
 * Adapter email — Resend en prod, console en dev.
 *
 * Activation Resend :
 *   RESEND_API_KEY=re_xxx
 *   EMAIL_FROM=devis@chauffage-artisanal.lu   (domaine vérifié dans Resend)
 *   EMAIL_ADMIN=contact@chauffage-artisanal.lu
 *
 * Sans ces variables, les emails sont loggés en console (utile pour dev).
 */

import type { LeadRecord } from "./devis-schema";
import { makeRecapToken } from "./recap-token";

function isResendConfigured() {
  return !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM && process.env.EMAIL_ADMIN);
}

async function sendViaResend(
  to: string | string[],
  subject: string,
  html: string,
  text: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY missing" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { ok: false, error: `Resend ${res.status} ${errText}` };
    }
    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

function sendViaConsole(to: string | string[], subject: string, text: string) {
  // eslint-disable-next-line no-console
  console.info("\n=== [email · dev mode] ===");
  // eslint-disable-next-line no-console
  console.info(`TO   : ${Array.isArray(to) ? to.join(", ") : to}`);
  // eslint-disable-next-line no-console
  console.info(`SUBJ : ${subject}`);
  // eslint-disable-next-line no-console
  console.info(text);
  // eslint-disable-next-line no-console
  console.info("===========================\n");
}

/* ───────────────────── Templates HTML ───────────────────── */

const LABELS = {
  service: {
    chauffage: "Chauffage",
    pac: "Pompe à chaleur",
    clim: "Climatisation",
    sanitaire: "Sanitaire",
    enr: "Énergies renouvelables",
    depannage: "Dépannage",
    autre: "Autre projet",
  },
  buildingType: {
    maison: "Maison individuelle",
    appartement: "Appartement",
    collectif: "Immeuble collectif",
    tertiaire: "Bureaux / tertiaire",
    autre: "Autre type",
  },
  construction: { neuf: "Construction neuve", renovation: "Rénovation" },
  energy: {
    fioul: "Fioul",
    gaz: "Gaz naturel / GPL",
    electrique: "Électrique",
    bois: "Bois / pellets",
    pac: "Pompe à chaleur",
    autre: "Autre énergie",
    inconnu: "Inconnue / à préciser",
  },
  timeline: {
    urgent: "Urgent (< 2 semaines)",
    court: "Sous 3 mois",
    annee: "Cette année",
    exploration: "Pas de date fixée",
  },
  budget: {
    less10: "< 10 000 €",
    "10-20": "10 000 – 20 000 €",
    "20-40": "20 000 – 40 000 €",
    "40plus": "> 40 000 €",
    inconnu: "Non précisé",
  },
  channel: {
    phone: "Appel téléphonique",
    email: "Email",
    sms: "SMS",
    whatsapp: "WhatsApp",
  },
} as const;

function pretty(category: keyof typeof LABELS, key: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (LABELS[category] as any)[key] ?? key;
}

function htmlShell(title: string, body: string) {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f6f0e4;font-family:'Inter Tight',Inter,Helvetica,Arial,sans-serif;color:#2a251e;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f6f0e4;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border:1px solid rgba(42,37,30,0.08);border-radius:24px;overflow:hidden;">
      <tr><td style="background:#1e1a15;color:#f6f0e4;padding:28px 32px;">
        <div style="font-family:'JetBrains Mono',Menlo,Consolas,monospace;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#b86a36;">Chauffage Artisanal · Luxembourg</div>
        <div style="font-family:Georgia,serif;font-size:28px;letter-spacing:-0.02em;margin-top:8px;">${title}</div>
      </td></tr>
      <tr><td style="padding:32px;">${body}</td></tr>
      <tr><td style="background:#ede5d3;padding:24px 32px;font-size:11px;color:#8b847a;text-align:center;">
        Message automatique · Chauffage Artisanal · Luxembourg
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid rgba(42,37,30,0.08);font-size:11px;color:#8b847a;font-family:'JetBrains Mono',Menlo,Consolas,monospace;text-transform:uppercase;letter-spacing:0.18em;width:160px;vertical-align:top;">${label}</td>
    <td style="padding:10px 0;border-bottom:1px solid rgba(42,37,30,0.08);font-size:14px;color:#2a251e;font-weight:500;vertical-align:top;">${value}</td>
  </tr>`;
}

function badge(text: string, color = "#b86a36") {
  return `<span style="display:inline-block;padding:4px 10px;border-radius:9999px;background:${color}1A;border:1px solid ${color}55;color:${color};font-family:'JetBrains Mono',Menlo,Consolas,monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.2em;">${text}</span>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function leadRows(lead: LeadRecord) {
  const servicesLabel = lead.services
    .map((s) => pretty("service", s))
    .join(" · ");
  return [
    row("Référence", lead.reference),
    row(
      lead.services.length > 1 ? "Projets" : "Projet",
      escapeHtml(servicesLabel),
    ),
    row("Bâtiment", `${pretty("buildingType", lead.buildingType)} · ${pretty("construction", lead.construction)}`),
    row("Surface", `${lead.surface} m²`),
    row("Énergie actuelle", pretty("energy", lead.currentEnergy)),
    row("Commune", escapeHtml(lead.commune)),
    row("Délai", pretty("timeline", lead.timeline)),
    row("Budget indicatif", pretty("budget", lead.budget)),
    row("Photos", lead.photoUrls.length > 0 ? `${lead.photoUrls.length} jointe(s)` : "Aucune"),
  ].join("");
}

function contactRows(lead: LeadRecord) {
  return [
    row("Nom", escapeHtml(lead.fullName)),
    row("Email", `<a href="mailto:${lead.email}" style="color:#b86a36;">${escapeHtml(lead.email)}</a>`),
    row("Téléphone", `<a href="tel:${lead.phone.replace(/\s/g, "")}" style="color:#b86a36;">${escapeHtml(lead.phone)}</a>`),
    row("Canal préféré", pretty("channel", lead.preferredChannel)),
  ].join("");
}

/* ───────────────────── Public API ───────────────────── */

export async function sendAdminNotification(lead: LeadRecord) {
  const servicesLabel = lead.services.map((s) => pretty("service", s)).join(" · ");
  const subject = `[Devis] Nouveau lead ${lead.reference} · ${servicesLabel} · ${lead.commune}`;
  const html = htmlShell(
    `Nouveau lead · ${lead.reference}`,
    `
    <div style="margin-bottom:20px;">
      ${lead.services.map((s) => badge(pretty("service", s))).join(" ")}
      ${badge(pretty("budget", lead.budget))}
      ${badge(pretty("timeline", lead.timeline), lead.timeline === "urgent" ? "#dc5a28" : "#b86a36")}
    </div>
    <div style="font-size:14px;color:#4a4338;margin-bottom:24px;">
      Reçu le ${new Date(lead.submittedAt).toLocaleString("fr-FR")} via <code>/devis</code>.
    </div>
    <h3 style="font-family:Georgia,serif;font-size:18px;margin:0 0 12px;color:#2a251e;">Projet</h3>
    <table cellpadding="0" cellspacing="0" width="100%">${leadRows(lead)}</table>
    <h3 style="font-family:Georgia,serif;font-size:18px;margin:32px 0 12px;color:#2a251e;">Contact</h3>
    <table cellpadding="0" cellspacing="0" width="100%">${contactRows(lead)}</table>
    ${lead.message ? `<h3 style="font-family:Georgia,serif;font-size:18px;margin:32px 0 12px;color:#2a251e;">Message</h3>
    <div style="background:#f6f0e4;padding:16px 18px;border-radius:12px;border:1px solid rgba(42,37,30,0.08);font-size:14px;color:#2a251e;white-space:pre-wrap;">${escapeHtml(lead.message)}</div>` : ""}
    <div style="margin-top:32px;text-align:center;">
      <a href="${process.env.PUBLIC_URL ?? "http://localhost:3008"}/admin/leads/${lead.reference}" style="display:inline-block;padding:12px 24px;border-radius:9999px;background:#1e1a15;color:#f6f0e4;font-size:13px;font-weight:500;text-decoration:none;">Ouvrir le dossier</a>
    </div>`,
  );
  const text = `Nouveau lead ${lead.reference}
${servicesLabel} · ${pretty("budget", lead.budget)} · ${pretty("timeline", lead.timeline)}

Projet
- Services : ${servicesLabel}
- Bâtiment : ${pretty("buildingType", lead.buildingType)} · ${pretty("construction", lead.construction)}
- Surface : ${lead.surface} m²
- Énergie actuelle : ${pretty("energy", lead.currentEnergy)}
- Commune : ${lead.commune}
- Délai : ${pretty("timeline", lead.timeline)}
- Budget : ${pretty("budget", lead.budget)}
- Photos : ${lead.photoUrls.length}

Contact
- ${lead.fullName}
- ${lead.email}
- ${lead.phone}
- Canal préféré : ${pretty("channel", lead.preferredChannel)}

${lead.message || ""}`;

  if (!isResendConfigured()) {
    sendViaConsole(process.env.EMAIL_ADMIN ?? "admin@example.lu", subject, text);
    return { ok: true, mode: "console" as const };
  }
  const r = await sendViaResend(process.env.EMAIL_ADMIN!, subject, html, text);
  return { ...r, mode: "resend" as const };
}

export async function sendClientConfirmation(lead: LeadRecord) {
  const subject = `Votre demande de devis · ${lead.reference}`;
  const baseUrl = process.env.PUBLIC_URL?.replace(/\/$/, "") ?? "http://localhost:3017";
  const recapUrl = `${baseUrl}/devis/recap/${encodeURIComponent(lead.reference)}?t=${makeRecapToken(lead.reference)}`;
  const html = htmlShell(
    "Votre demande est entre nos mains",
    `
    <p style="font-size:16px;line-height:1.6;color:#2a251e;margin-top:0;">
      Bonjour ${escapeHtml(lead.fullName.split(" ")[0] || "")},
    </p>
    <p style="font-size:15px;line-height:1.7;color:#4a4338;">
      Nous avons bien reçu votre demande de devis et l&apos;avons enregistrée sous la référence
      <strong>${lead.reference}</strong>. Un membre de notre bureau d&apos;études va analyser
      votre projet, puis vous recontactera via <strong>${pretty("channel", lead.preferredChannel).toLowerCase()}</strong>.
    </p>
    <h3 style="font-family:Georgia,serif;font-size:18px;margin:28px 0 12px;color:#2a251e;">Récap de votre projet</h3>
    <table cellpadding="0" cellspacing="0" width="100%">${leadRows(lead)}</table>
    <div style="margin-top:32px;text-align:center;">
      <a href="${baseUrl}/espace/${encodeURIComponent(lead.reference)}?t=${makeRecapToken(lead.reference)}" style="display:inline-block;padding:12px 24px;border-radius:9999px;background:#1e1a15;color:#f6f0e4;font-size:13px;font-weight:500;text-decoration:none;">🔭 Suivre l&apos;avancement de mon dossier</a>
    </div>
    <div style="margin-top:10px;text-align:center;">
      <a href="${recapUrl}" style="display:inline-block;padding:10px 20px;border-radius:9999px;background:transparent;border:1px solid rgba(42,37,30,0.2);color:#2a251e;font-size:12px;text-decoration:none;">📄 Imprimer / PDF</a>
    </div>
    <p style="font-size:12px;line-height:1.6;color:#8b847a;margin-top:16px;text-align:center;">
      Ces liens privés vous permettent de consulter votre dossier à tout moment, et de conserver une copie de votre demande.
    </p>
    <p style="font-size:13px;line-height:1.7;color:#8b847a;margin-top:28px;">
      Vous pouvez répondre à ce message pour ajouter des informations, ou nous contacter directement.
    </p>
    <p style="font-size:11px;color:#8b847a;margin-top:20px;font-family:'JetBrains Mono',Menlo,monospace;text-transform:uppercase;letter-spacing:0.2em;">
      Conformément au RGPD · vos données peuvent être supprimées sur demande.
    </p>`,
  );
  const servicesLabelClient = lead.services.map((s) => pretty("service", s)).join(" · ");
  const text = `Bonjour ${lead.fullName.split(" ")[0] || ""},

Nous avons bien reçu votre demande de devis (référence ${lead.reference}).
Un membre de notre bureau d'études va analyser votre projet et vous recontactera via ${pretty("channel", lead.preferredChannel).toLowerCase()}.

Récap :
- ${lead.services.length > 1 ? "Projets" : "Projet"} : ${servicesLabelClient}
- Bâtiment : ${pretty("buildingType", lead.buildingType)} · ${pretty("construction", lead.construction)}
- Surface : ${lead.surface} m²
- Énergie actuelle : ${pretty("energy", lead.currentEnergy)}
- Commune : ${lead.commune}
- Délai : ${pretty("timeline", lead.timeline)}
- Budget : ${pretty("budget", lead.budget)}

Suivre l'avancement de mon dossier :
${baseUrl}/espace/${encodeURIComponent(lead.reference)}?t=${makeRecapToken(lead.reference)}

Récap consultable et imprimable :
${recapUrl}

Vous pouvez répondre à ce message pour ajouter des informations.

— Chauffage Artisanal`;

  if (!isResendConfigured()) {
    sendViaConsole(lead.email, subject, text);
    return { ok: true, mode: "console" as const };
  }
  const r = await sendViaResend(lead.email, subject, html, text);
  return { ...r, mode: "resend" as const };
}
