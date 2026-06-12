"use client";

import { Phone, Clock } from "lucide-react";
import { COMPANY } from "@/lib/company-info";
import { trackEvent } from "@/lib/track-event";

export function EmergencyBar() {
  return (
    <div className="relative z-50 hidden md:block border-b border-pierre bg-creme/85 backdrop-blur-md">
      <div className="container flex items-center justify-between py-2.5 text-[11px] font-mono uppercase tracking-eyebrow">
        <div className="flex items-center gap-6 text-muted">
          <span className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-terracotta opacity-75"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-terracotta"></span>
            </span>
            Service disponible · Luxembourg
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" /> Intervention selon disponibilité
          </span>
          <span>Maison technique luxembourgeoise · depuis 1994</span>
        </div>
        <a
          href={`tel:${COMPANY.phone.tel}`}
          onClick={() => trackEvent("phone_click", { ctaSurface: "emergency-bar" })}
          className="flex items-center gap-2 text-anthra hover:text-bleu transition-colors"
        >
          <Phone className="h-3 w-3" />
          Dépannage · nous contacter
        </a>
      </div>
    </div>
  );
}
