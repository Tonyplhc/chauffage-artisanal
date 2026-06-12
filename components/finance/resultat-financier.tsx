import { eur, financeText, type FinanceKind } from "@/lib/finance";

/**
 * Carte de résultat financier réutilisable — applique le sémaphore (voir
 * lib/finance.ts). À utiliser partout où un calcul produit un résultat :
 * estimateur, simulateur aides, ROI, configurateur, assistant IA, etc.
 *
 * Structure conventionnelle (chaque ligne optionnelle) :
 *   Aujourd'hui (perte) · Après (neutre) · Économie (gain, héros) ·
 *   Aides (gain) · ROI (gain) · Gain 10 ans (gain).
 */
export interface LigneFinanciere {
  label: string;
  /** Nombre (formaté en €) ou chaîne déjà formatée (ex. "6,8 ans"). */
  value: number | string;
  kind: FinanceKind;
  /** Suffixe : "/an", "ans", "%"… */
  unit?: string;
  /** Préfixe de signe : "+", "−". */
  prefix?: string;
  /** Met la ligne en avant (gros chiffre — typiquement l'économie). */
  hero?: boolean;
}

export function ResultatFinancier({
  titre = "Votre résultat estimé",
  lignes,
  className,
}: {
  titre?: string;
  lignes: LigneFinanciere[];
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl bg-white border border-pierre shadow-lift overflow-hidden ${className ?? ""}`}
    >
      <div className="px-7 lg:px-8 pt-6">
        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">{titre}</div>
      </div>
      <div className="px-7 lg:px-8 pb-6 pt-2 divide-y divide-pierre">
        {lignes.map((l) => (
          <div
            key={l.label}
            className={`flex items-baseline justify-between gap-4 ${l.hero ? "py-4" : "py-3"}`}
          >
            <span
              className={`font-mono text-[10px] uppercase tracking-eyebrow ${
                l.hero ? "text-gain" : "text-taupe"
              }`}
            >
              {l.label}
            </span>
            <span
              className={`font-display tracking-tight ${
                l.hero ? "text-5xl lg:text-6xl tracking-tightest leading-none" : "text-2xl"
              } ${financeText(l.kind)}`}
            >
              {l.prefix ?? ""}
              {typeof l.value === "number" ? eur(l.value) : l.value}
              {l.unit ? <span className="text-base text-muted ml-1">{l.unit}</span> : null}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
