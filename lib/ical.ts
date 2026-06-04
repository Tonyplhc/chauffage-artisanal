/**
 * Génération de feed iCal (RFC 5545).
 *
 * Implémentation minimaliste suffisant pour Google Calendar / Apple Calendar /
 * Outlook. Pas de support des récurrences ni des invitations — pour un export
 * "vue seule" abonnable.
 *
 * Référence : https://datatracker.ietf.org/doc/html/rfc5545
 */

import type { CalendarEvent } from "./admin-calendar";

const CRLF = "\r\n";

function formatICalDate(iso: string): string {
  // Format UTC : YYYYMMDDTHHmmssZ
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

/** Échappe les caractères spéciaux RFC 5545 : `\` `,` `;` newlines. */
function escapeICalText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n/g, "\\n")
    .replace(/\n/g, "\\n");
}

/** Plie une ligne longue à 75 octets (RFC 5545 §3.1) */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (i === 0) {
      out.push(line.slice(0, 75));
      i = 75;
    } else {
      out.push(" " + line.slice(i, i + 74));
      i += 74;
    }
  }
  return out.join(CRLF);
}

export function generateIcal(opts: {
  name: string;
  events: CalendarEvent[];
  timezone?: string;
}): string {
  const now = formatICalDate(new Date().toISOString());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Chauffage Artisanal//Admin Calendar//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    foldLine(`X-WR-CALNAME:${escapeICalText(opts.name)}`),
    "X-WR-TIMEZONE:Europe/Luxembourg",
    foldLine(
      `X-WR-CALDESC:${escapeICalText("Pipeline admin · RDV, urgents, relances et rappels")}`,
    ),
  ];

  for (const e of opts.events) {
    lines.push("BEGIN:VEVENT");
    lines.push(foldLine(`UID:${e.uid}`));
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART:${formatICalDate(e.startAt)}`);
    lines.push(`DTEND:${formatICalDate(e.endAt)}`);
    lines.push(foldLine(`SUMMARY:${escapeICalText(e.summary)}`));
    if (e.description) {
      lines.push(foldLine(`DESCRIPTION:${escapeICalText(e.description)}`));
    }
    if (e.reference) {
      lines.push(
        foldLine(
          `URL:${process.env.PUBLIC_URL ?? "http://localhost:3020"}/admin/leads/${e.reference}`,
        ),
      );
    }
    // Catégorie selon type
    const category =
      e.kind === "booking"
        ? "RDV"
        : e.kind === "urgent"
          ? "URGENT"
          : e.kind === "follow-up"
            ? "RELANCE"
            : "RAPPEL";
    lines.push(`CATEGORIES:${category}`);
    // Trigger d'alarme : 15 min avant pour les RDV
    if (e.kind === "booking") {
      lines.push("BEGIN:VALARM");
      lines.push("ACTION:DISPLAY");
      lines.push(`DESCRIPTION:${escapeICalText(e.summary)}`);
      lines.push("TRIGGER:-PT15M");
      lines.push("END:VALARM");
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join(CRLF) + CRLF;
}
