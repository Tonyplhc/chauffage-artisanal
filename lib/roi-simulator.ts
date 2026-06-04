/**
 * Simulateur ROI 20 ans : PAC air/eau vs chaudière gaz.
 *
 * Compare deux scénarios :
 *   A) Garder / installer chaudière gaz condensation
 *   B) Installer PAC air/eau
 *
 * Calculs année par année :
 *   - Coût initial (avec ou sans aide Klimabonus pour scénario B)
 *   - Consommation annuelle (kWh thermique converti en énergie payée)
 *   - Coût annuel énergie (avec inflation)
 *   - Coût annuel entretien
 *   - Cash flow cumulé scenario A − scénario B
 *   - Année de bascule (PAC devient rentable)
 *
 * Hypothèses paramétrables avec valeurs par défaut Lux 2026 prudentes :
 *   - Prix kWh gaz : 0.11 €/kWh (TTC) — moyenne récente Lux
 *   - Prix kWh élec PAC : 0.22 €/kWh (TTC) — moyenne récente Lux
 *   - SCOP PAC : 3.5
 *   - Rendement chaudière condensation : 0.95
 *   - Inflation énergie : 3 %/an (prudent vs hausses récentes)
 *   - Entretien gaz : 200 €/an
 *   - Entretien PAC : 250 €/an
 *
 * Toutes les hypothèses sont visibles dans le résultat pour transparence.
 * AUCUNE garantie ni promesse — c'est un outil de réflexion, pas un contrat.
 */

export type RoiInput = {
  /** Besoins thermiques annuels du logement (kWh/an). */
  annualKwhNeeds: number;
  /** Coût initial chaudière gaz neuve (€). */
  gasInitialCost: number;
  /** Coût initial PAC (€). */
  pacInitialCost: number;
  /** Aide Klimabonus reçue pour la PAC (€). */
  klimabonusAid: number;

  /** Prix kWh gaz TTC. */
  gasPricePerKwh?: number;
  /** Prix kWh électricité TTC. */
  electricityPricePerKwh?: number;
  /** Rendement chaudière (0..1). */
  gasEfficiency?: number;
  /** SCOP PAC. */
  pacScop?: number;
  /** Inflation annuelle énergie. */
  energyInflation?: number;
  /** Entretien annuel gaz. */
  gasAnnualMaintenance?: number;
  /** Entretien annuel PAC. */
  pacAnnualMaintenance?: number;
  /** Durée simulation (années). */
  years?: number;
};

export type YearRow = {
  year: number;
  gasEnergyCost: number;
  pacEnergyCost: number;
  gasMaintenance: number;
  pacMaintenance: number;
  gasTotalYear: number;
  pacTotalYear: number;
  gasCumulative: number;
  pacCumulative: number;
  /** Différence cumulée (PAC − gaz). Négatif = PAC moins cher cumulé. */
  cumulativeDelta: number;
};

export type RoiResult = {
  assumptions: Required<Omit<RoiInput, "annualKwhNeeds" | "gasInitialCost" | "pacInitialCost" | "klimabonusAid">>;
  initial: {
    gasNetCost: number;
    pacNetCost: number;
    overInvestment: number; // PAC − gaz (avec aide déduite)
  };
  rows: YearRow[];
  /** Année où la PAC devient plus rentable cumulativement (1-based). null si jamais. */
  breakEvenYear: number | null;
  /** Économies totales sur la période (gaz − PAC), pos = PAC gagne. */
  totalSavings: number;
};

const DEFAULTS = {
  gasPricePerKwh: 0.11,
  electricityPricePerKwh: 0.22,
  gasEfficiency: 0.95,
  pacScop: 3.5,
  energyInflation: 0.03,
  gasAnnualMaintenance: 200,
  pacAnnualMaintenance: 250,
  years: 20,
};

export function simulateRoi(input: RoiInput): RoiResult {
  const assumptions = {
    gasPricePerKwh: input.gasPricePerKwh ?? DEFAULTS.gasPricePerKwh,
    electricityPricePerKwh:
      input.electricityPricePerKwh ?? DEFAULTS.electricityPricePerKwh,
    gasEfficiency: input.gasEfficiency ?? DEFAULTS.gasEfficiency,
    pacScop: input.pacScop ?? DEFAULTS.pacScop,
    energyInflation: input.energyInflation ?? DEFAULTS.energyInflation,
    gasAnnualMaintenance:
      input.gasAnnualMaintenance ?? DEFAULTS.gasAnnualMaintenance,
    pacAnnualMaintenance:
      input.pacAnnualMaintenance ?? DEFAULTS.pacAnnualMaintenance,
    years: input.years ?? DEFAULTS.years,
  };

  const gasNetCost = input.gasInitialCost;
  const pacNetCost = Math.max(0, input.pacInitialCost - input.klimabonusAid);
  const overInvestment = pacNetCost - gasNetCost;

  const rows: YearRow[] = [];
  let gasCumulative = gasNetCost;
  let pacCumulative = pacNetCost;
  let breakEvenYear: number | null = null;

  for (let y = 1; y <= assumptions.years; y++) {
    const inflationFactor = Math.pow(1 + assumptions.energyInflation, y - 1);
    const gasKwhPaid = input.annualKwhNeeds / assumptions.gasEfficiency;
    const pacKwhPaid = input.annualKwhNeeds / assumptions.pacScop;
    const gasEnergyCost = Math.round(
      gasKwhPaid * assumptions.gasPricePerKwh * inflationFactor,
    );
    const pacEnergyCost = Math.round(
      pacKwhPaid * assumptions.electricityPricePerKwh * inflationFactor,
    );
    const gasTotalYear = gasEnergyCost + assumptions.gasAnnualMaintenance;
    const pacTotalYear = pacEnergyCost + assumptions.pacAnnualMaintenance;
    gasCumulative += gasTotalYear;
    pacCumulative += pacTotalYear;
    const delta = pacCumulative - gasCumulative;
    if (breakEvenYear === null && delta < 0) {
      breakEvenYear = y;
    }
    rows.push({
      year: y,
      gasEnergyCost,
      pacEnergyCost,
      gasMaintenance: assumptions.gasAnnualMaintenance,
      pacMaintenance: assumptions.pacAnnualMaintenance,
      gasTotalYear,
      pacTotalYear,
      gasCumulative,
      pacCumulative,
      cumulativeDelta: delta,
    });
  }

  const totalSavings = gasCumulative - pacCumulative;

  return {
    assumptions,
    initial: { gasNetCost, pacNetCost, overInvestment },
    rows,
    breakEvenYear,
    totalSavings: Math.round(totalSavings),
  };
}
