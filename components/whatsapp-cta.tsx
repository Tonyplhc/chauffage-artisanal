"use client";

/**
 * Bouton flottant WhatsApp Business — bas-droite, ouvert sur tap.
 *
 * Comportement :
 *   - Caché sur /admin/* (pas de pollution UI admin)
 *   - Apparaît après 800ms (ne disturbe pas l'arrivée sur la page)
 *   - Tap → ouvre wa.me avec message pré-rempli mentionnant la page consultée
 *   - Discret : bulle noire avec un point pulsant bleu (pas le vert WhatsApp
 *     officiel agressif — reste cohérent avec le DA du site)
 *
 * Le numéro est piloté par NEXT_PUBLIC_WHATSAPP_NUMBER (format international
 * sans +, ex: 352621234567). Si absent : pointeur vers /contact.
 */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X } from "lucide-react";

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

const PAGE_LABELS: Record<string, string> = {
  "/": "depuis votre site",
  "/chauffage": "à propos d'un projet chauffage",
  "/pompes-a-chaleur": "à propos d'une pompe à chaleur",
  "/climatisation": "à propos de climatisation",
  "/sanitaire": "à propos d'un projet sanitaire",
  "/energies-renouvelables": "à propos des énergies renouvelables",
  "/entretien": "à propos d'un contrat d'entretien",
  "/depannage": "pour un dépannage",
  "/primes-aides": "à propos des aides Klimabonus",
  "/recrutement": "à propos d'une candidature",
  "/devis": "à propos d'un devis",
  "/realisations": "à propos de vos réalisations",
};

export function WhatsAppCta() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  // Hide on /admin/*
  if (pathname?.startsWith("/admin")) return null;

  const label = PAGE_LABELS[pathname ?? "/"] ?? "depuis votre site";
  const msg = encodeURIComponent(
    `Bonjour, je vous écris ${label} — j'aurais une question sur mon projet.`,
  );
  const href = WA_NUMBER
    ? `https://wa.me/${WA_NUMBER}?text=${msg}`
    : "/contact";

  return (
    <>
      {/* Popover */}
      {open && (
        <div
          className="fixed bottom-24 right-5 lg:right-7 z-[55] w-72 p-4 rounded-2xl bg-white border border-pierre shadow-lift"
          style={{ animation: "wa-fade 0.25s ease-out" }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu">
                WhatsApp · réponse rapide
              </div>
              <div className="mt-1.5 font-display text-lg text-anthra leading-tight">
                Une question sur votre projet ?
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="h-7 w-7 grid place-items-center rounded-full bg-creme border border-pierre text-taupe hover:bg-navy hover:text-creme transition-colors shrink-0"
              aria-label="Fermer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-xs text-taupe leading-relaxed">
            Échangez directement avec notre équipe — les messages sont lus pendant les
            heures ouvrées.
          </p>
          <a
            href={href}
            target={WA_NUMBER ? "_blank" : undefined}
            rel={WA_NUMBER ? "noopener noreferrer" : undefined}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy text-creme px-4 py-2.5 text-sm font-medium hover:bg-bleu transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            {WA_NUMBER ? "Démarrer la conversation" : "Aller au contact"}
          </a>
          <style>{`
            @keyframes wa-fade {
              0% { opacity: 0; transform: translateY(8px) scale(0.96); }
              100% { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Discuter sur WhatsApp"
        className={`fixed bottom-5 right-5 lg:bottom-7 lg:right-7 z-[55] h-14 w-14 lg:h-16 lg:w-16 rounded-full bg-navy text-creme shadow-lift border border-pierre grid place-items-center transition-all hover:bg-bleu hover:scale-105 ${
          visible ? "opacity-100" : "opacity-0 pointer-events-none translate-y-2"
        }`}
        style={{ transition: "opacity 0.4s, transform 0.4s, background 0.2s" }}
      >
        <MessageCircle className="h-5 w-5 lg:h-6 lg:w-6" />
        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full rounded-full bg-bleu opacity-75 animate-ping" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-bleu border-2 border-anthra" />
        </span>
      </button>
    </>
  );
}
