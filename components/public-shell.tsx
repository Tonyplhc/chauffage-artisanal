"use client";

/**
 * PublicShell — wrapper qui n'affiche son contenu QUE sur les routes publiques.
 * Sur /admin et /equipement (ERP / portail client), on cache le chrome public
 * (Nav, Footer, EmergencyBar, WhatsAppCta, ChatWidget).
 */

import { usePathname } from "next/navigation";

const HIDDEN_PREFIXES = [
  "/admin",
  "/equipement",
  "/devis/officiel",
];

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const isHidden = HIDDEN_PREFIXES.some((p) => pathname.startsWith(p));
  if (isHidden) return null;
  return <>{children}</>;
}
