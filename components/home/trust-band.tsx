import { Check } from "lucide-react";
import { COMPANY } from "@/lib/company-info";

/**
 * Bande de confiance — signaux RÉELS, above-the-fold.
 *   - Ancienneté (1994), société établie au Luxembourg
 *   - Affiliations vérifiées (lib/company-info.ts → affiliations)
 *   - Partenaires constructeurs agréés (réels)
 * Aucune donnée inventée : tout est sourcé/vérifié.
 */

// Partenaires constructeurs réels (agréés installateur).
const PARTNERS = ["Viessmann", "Buderus", "De Dietrich"];

const SIGNALS = [
  `Depuis ${COMPANY.foundedYear}`,
  "Société établie au Luxembourg",
  COMPANY.affiliations[0].label, // Fédération des Artisans
  COMPANY.affiliations[1].label, // Fédération du Génie Technique
];

export function TrustBand() {
  return (
    <section className="border-y border-pierre bg-linen font-ui">
      <div className="container py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-6 text-sm">
          {SIGNALS.map((s) => (
            <div key={s} className="flex items-center gap-2 text-taupe">
              <Check className="h-4 w-4 text-bleu shrink-0" />
              <span>{s}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-pierre flex flex-col sm:flex-row items-center gap-4 justify-between">
          <span className="font-mono text-[10px] uppercase tracking-eyebrow text-taupe">
            Partenaires agréés <span className="text-brique">· réels</span>
          </span>
          <div className="flex items-center gap-8 grayscale opacity-70">
            {PARTNERS.map((p) => (
              <span key={p} className="font-display text-2xl tracking-tight text-anthra">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
