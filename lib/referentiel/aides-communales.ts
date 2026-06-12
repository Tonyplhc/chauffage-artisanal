/**
 * RÉFÉRENTIEL — Aides communales (Klimapakt), cumulables avec le Klimabonus.
 *
 * Source : règlements communaux + KLIMABONUS_CUMULS (lib/klimabonus-2026.ts).
 * ⚠️ [À COMPLÉTER] avec les vrais règlements commune par commune. À date :
 *   - Ville de Luxembourg : +50 % du Klimabonus (confirmé).
 *   - Autres communes : fourchette générique 1 000–3 000 € forfaitaires,
 *     marquée « à confirmer » tant que le règlement local n'est pas vérifié.
 *
 * Charte Règle N°4 : on n'affirme jamais un montant communal précis non vérifié →
 * on renvoie une fourchette honnête + le flag `aConfirmer`.
 */
export interface AideCommunale {
  min: number;
  max: number;
  note: string;
  /** true = estimation générique à valider avec la commune. */
  aConfirmer: boolean;
}

/** Communes au règlement connu/spécifique (à enrichir). */
const COMMUNES_CONNUES: Record<string, (klimabonusEur: number) => AideCommunale> = {
  luxembourg: (kb) => {
    const m = Math.round(kb * 0.5);
    return {
      min: m,
      max: m,
      note: "Ville de Luxembourg : +50 % du Klimabonus (confirmé).",
      aConfirmer: false,
    };
  },
};

/**
 * Estimation de l'aide communale pour une commune donnée.
 * @param commune nom de la commune (insensible à la casse)
 * @param klimabonusEur montant Klimabonus (pour les communes en pourcentage)
 */
export function aideCommunaleEstimee(commune: string | undefined, klimabonusEur: number): AideCommunale {
  const key = (commune ?? "").trim().toLowerCase();
  const known = COMMUNES_CONNUES[key];
  if (known) return known(klimabonusEur);
  return {
    min: 1000,
    max: 3000,
    note: "Estimation générique — à confirmer selon le règlement de votre commune.",
    aConfirmer: true,
  };
}
