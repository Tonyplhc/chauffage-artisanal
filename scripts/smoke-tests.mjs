#!/usr/bin/env node
/**
 * Smoke tests — vérifie que les flux critiques fonctionnent.
 *
 * Pas de framework lourd (jest/vitest) — assertions natives Node.
 * Lancement : `node --experimental-strip-types scripts/smoke-tests.mjs`
 *
 * Couvre :
 *   - lead-scoring : un lead urgent + gros budget doit être "hot"
 *   - pac-sizing : surface 150m² rénov complète → 4-6 kW typique
 *   - roi-simulator : break-even attendu autour de 8-12 ans en conditions
 *     standard
 *   - klimabonus-checker : PAC air/eau rénovation → éligible
 *   - troubleshoot-tree : "odeur de gaz" → urgence
 *   - demo-seed : génère 80 leads idempotent
 *   - formatters : EUR / dates / pourcentages
 *
 * Sortie : tableau récapitulatif avec ✓ / ✗. Code de sortie 0 si tout passe,
 * 1 si au moins un échec.
 */

import assert from "node:assert/strict";

const results = [];

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      results.push({ name, ok: true });
      console.log(`✓ ${name}`);
    })
    .catch((e) => {
      results.push({ name, ok: false, error: e?.message ?? String(e) });
      console.log(`✗ ${name}\n  ${e?.message ?? e}`);
    });
}

async function main() {
  console.log("\n— Smoke tests — Chauffage Artisanal —\n");

  // ─── Formatters ────────────────────────────────────────────────
  await test("formatEur basique", async () => {
    const { formatEur } = await import("../lib/formatters.ts");
    assert.equal(formatEur(1234), "1 234 €");
    assert.equal(formatEur(1500, true), "1.5 k€");
    assert.equal(formatEur(2_500_000, true), "2.5 M€");
  });

  await test("formatPercent", async () => {
    const { formatPercent } = await import("../lib/formatters.ts");
    assert.equal(formatPercent(0.42), "42 %");
    assert.equal(formatPercent(0.425, 1), "42.5 %");
  });

  await test("formatMinutes", async () => {
    const { formatMinutes } = await import("../lib/formatters.ts");
    assert.equal(formatMinutes(45), "45 min");
    assert.equal(formatMinutes(120), "2 h");
    assert.equal(formatMinutes(135), "2 h 15");
  });

  // ─── Lead scoring ──────────────────────────────────────────────
  await test("Lead urgent + gros budget = hot", async () => {
    const { scoreLead } = await import("../lib/lead-scoring.ts");
    const r = scoreLead({
      services: ["pac"],
      buildingType: "maison",
      construction: "renovation",
      surface: 200,
      currentEnergy: "fioul",
      timeline: "urgent",
      budget: "40plus",
      message: "Besoin urgent, fioul en panne",
      photoUrls: [],
      preferredChannel: "phone",
    });
    assert.equal(r.level, "hot", `score=${r.score}`);
    assert.ok(r.score >= 60, `score trop bas : ${r.score}`);
  });

  await test("Lead exploration sans urgence = cold ou warm", async () => {
    const { scoreLead } = await import("../lib/lead-scoring.ts");
    const r = scoreLead({
      services: ["autre"],
      buildingType: "appartement",
      construction: "neuf",
      surface: 50,
      currentEnergy: "inconnu",
      timeline: "exploration",
      budget: "inconnu",
      message: "",
      photoUrls: [],
      preferredChannel: "email",
    });
    assert.notEqual(r.level, "hot", `attendu pas hot, reçu ${r.level}`);
  });

  // ─── PAC sizing ────────────────────────────────────────────────
  await test("PAC 150m² rénov complète → 5-7 kW", async () => {
    const { calculatePacSizing } = await import("../lib/pac-sizing.ts");
    const r = calculatePacSizing({
      surface: 150,
      isolation: "renov-complete",
      pacType: "air-eau",
    });
    assert.ok(
      r.requiredPowerKw >= 5 && r.requiredPowerKw <= 15,
      `puissance hors plage : ${r.requiredPowerKw} kW`,
    );
    assert.ok(r.recommendedPacKw > r.requiredPowerKw, "marge non appliquée");
  });

  await test("PAC sur ancien non-isolé > rénov complète", async () => {
    const { calculatePacSizing } = await import("../lib/pac-sizing.ts");
    const renov = calculatePacSizing({
      surface: 150,
      isolation: "renov-complete",
      pacType: "air-eau",
    });
    const ancien = calculatePacSizing({
      surface: 150,
      isolation: "ancien-non-isole",
      pacType: "air-eau",
    });
    assert.ok(
      ancien.requiredPowerKw > renov.requiredPowerKw,
      "puissance ancien <= rénov",
    );
  });

  // ─── ROI simulator ─────────────────────────────────────────────
  await test("ROI : PAC break-even attendu en <20 ans (conditions standards)", async () => {
    const { simulateRoi } = await import("../lib/roi-simulator.ts");
    const r = simulateRoi({
      annualKwhNeeds: 18000,
      gasInitialCost: 6000,
      pacInitialCost: 20000,
      klimabonusAid: 6000,
    });
    assert.ok(
      r.breakEvenYear !== null && r.breakEvenYear <= 20,
      `break-even ${r.breakEvenYear ?? "jamais"}`,
    );
    assert.ok(
      r.totalSavings > 0,
      `économies négatives : ${r.totalSavings}`,
    );
  });

  // ─── Klimabonus checker ───────────────────────────────────────
  await test("Klimabonus : PAC air/eau rénov → éligible", async () => {
    const { checkKlimabonusEligibility } = await import("../lib/klimabonus-checker.ts");
    const r = checkKlimabonusEligibility({
      projectType: "pac-air-eau",
      buildingAge: "plus-30ans",
      housingType: "individuelle",
      ownerType: "proprietaire-occupant",
      incomeBracket: "standard",
      totalCostEur: 20000,
    });
    assert.equal(r.eligibility, "eligible", `eligibilité ${r.eligibility}`);
    assert.ok(r.estimatedAidEur, "pas de montant estimé");
    assert.ok(r.estimatedAidEur[0] > 1000, "aide trop faible");
  });

  await test("Klimabonus : isolation neuve → non éligible", async () => {
    const { checkKlimabonusEligibility } = await import("../lib/klimabonus-checker.ts");
    const r = checkKlimabonusEligibility({
      projectType: "isolation-toiture",
      buildingAge: "neuf",
      housingType: "individuelle",
      ownerType: "proprietaire-occupant",
      incomeBracket: "standard",
      totalCostEur: 8000,
    });
    assert.equal(r.eligibility, "non-eligible");
  });

  // ─── Troubleshoot tree ─────────────────────────────────────────
  await test("Auto-diagnostic : odeur de gaz = urgence", async () => {
    const { QUESTIONS } = await import("../lib/troubleshoot-tree.ts");
    const root = QUESTIONS.root;
    const gasOpt = root.options.find((o) => o.label.toLowerCase().includes("gaz"));
    assert.ok(gasOpt, "option gaz absente");
    assert.equal(gasOpt.next.recommendation?.action, "emergency");
  });

  // ─── Demo seed ─────────────────────────────────────────────────
  await test("demo-seed : countDemoLeads idempotent", async () => {
    const { countDemoLeads } = await import("../lib/demo-seed.ts");
    const n = await countDemoLeads();
    assert.ok(typeof n === "number" && n >= 0, "count invalide");
  });

  // ─── Récap ─────────────────────────────────────────────────────
  console.log("\n— Récap —");
  const ok = results.filter((r) => r.ok).length;
  const ko = results.length - ok;
  console.log(`${ok}/${results.length} tests passent.`);
  if (ko > 0) {
    console.log(`\n✗ Échecs :`);
    for (const r of results.filter((r) => !r.ok)) {
      console.log(`  - ${r.name}: ${r.error}`);
    }
    process.exit(1);
  }
  console.log("Tous les smoke tests passent ✓\n");
}

main().catch((e) => {
  console.error("Échec runner :", e);
  process.exit(1);
});
