/**
 * Exécuteur d'actions automation, SANS support delay (pour usage interne du
 * delayed-actions-store qui appelle la version "plain").
 *
 * Cette séparation évite une dépendance circulaire entre automations-store
 * et delayed-actions-store.
 */

import type { Action } from "./automations-store";
import type { LeadRecord } from "./devis-schema";
import { updateLead } from "./leads-store";
import { getTemplate, renderTemplate } from "./email-templates-store";
import { logger } from "./logger";
import { logActivity } from "./activity-log";

export async function executePlainAction(
  action: Action,
  lead: LeadRecord,
  ruleName: string,
): Promise<void> {
  try {
    if (action.type === "setStatus") {
      await updateLead(lead.reference, { status: action.status });
    } else if (action.type === "assignTo") {
      await updateLead(lead.reference, { assignedTo: action.email });
    } else if (action.type === "addTag") {
      const current =
        (lead.metadata as { tags?: string[] } | undefined)?.tags ?? [];
      const next = current.includes(action.tag) ? current : [...current, action.tag];
      await updateLead(lead.reference, {
        metadata: { ...lead.metadata, tags: next },
      });
    } else if (action.type === "addNote") {
      const current = lead.notes ?? "";
      const stamp = new Date().toLocaleString("fr-FR");
      const next = current
        ? `${current}\n\n[Auto retardé · ${stamp}] ${action.text}`
        : `[Auto retardé · ${stamp}] ${action.text}`;
      await updateLead(lead.reference, { notes: next });
    } else if (action.type === "sendTemplate") {
      const tpl = await getTemplate(action.templateId);
      if (!tpl) return;
      const { subject, body } = renderTemplate(tpl, lead);
      if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM,
            to: [lead.email],
            subject,
            text: body,
          }),
        });
      } else {
        // eslint-disable-next-line no-console
        console.info(`\n=== [automation retardée · dev] ${ruleName} → ${lead.email} ===
SUBJ : ${subject}
${body}
=====================================================\n`);
      }
      void logActivity(
        "lead.template_sent",
        `Template auto retardé · ${tpl.name} (règle: ${ruleName})`,
        { reference: lead.reference, meta: { templateId: tpl.id, automated: true, delayed: true } },
      );
    }
  } catch (e) {
    logger.error("automation.delayed_action_failed", e, { rule: ruleName });
  }
}
