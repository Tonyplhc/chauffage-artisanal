#!/usr/bin/env node
/**
 * Script CLI pour seed la base avec 80 leads démo réalistes.
 *
 * Usage :
 *   node scripts/seed-demo.mjs           → seed si vide
 *   node scripts/seed-demo.mjs --force   → recrée même si déjà seed
 *   node scripts/seed-demo.mjs --remove  → supprime tous les leads démo
 *
 * Doit être lancé depuis la racine du projet (où se trouve data/).
 * S'appuie sur `lib/demo-seed.ts` compilé via tsx ou ts-node ; ici on
 * passe par un import dynamique pour ne pas avoir besoin d'un runner externe.
 *
 * IMPORTANT : ce script écrit directement dans data/leads.json. Il NE doit pas
 * être lancé en production (où les leads sont en Supabase). Faire un dry-run
 * en local d'abord pour comprendre l'impact.
 */

import { register } from "node:module";
import { pathToFileURL } from "node:url";

// Active le loader TS de Next 14 pour exécuter le module TypeScript directement.
// On utilise une approche minimale : on parse les flags, on charge le module
// via import() — Next config + tsconfig moduleResolution gèrent le reste.

const argv = process.argv.slice(2);
const flags = {
  force: argv.includes("--force"),
  remove: argv.includes("--remove"),
};

async function main() {
  // Import dynamique du module compilé. Si lancé sans build, l'utilisateur
  // doit d'abord faire `npm run build` ou utiliser `npx tsx`.
  let mod;
  try {
    mod = await import("../lib/demo-seed.ts");
  } catch (e) {
    console.error(
      "\n⚠ Impossible d'importer lib/demo-seed.ts en runtime Node pur.\n",
    );
    console.error(
      "Utilisez `npx tsx scripts/seed-demo.mjs` (recommandé en dev)",
    );
    console.error("ou compilez via `npm run build` avant.\n");
    console.error("Détail :", e?.message ?? e);
    process.exit(1);
  }

  if (flags.remove) {
    const r = await mod.removeDemoLeads();
    console.log(
      `✓ ${r.removed} leads démo supprimés. Total après : ${r.totalAfter}.`,
    );
    return;
  }

  const result = await mod.seedDemoLeads({ force: flags.force });
  if (!result.ok) {
    console.log(
      `⚠ Rien à faire — ${result.alreadyPresent} leads démo déjà présents.`,
    );
    console.log(
      `  Pour recréer : node scripts/seed-demo.mjs --force`,
    );
    process.exit(0);
  }
  console.log(
    `✓ ${result.inserted} leads démo générés. Total en base : ${result.totalAfter}.`,
  );
  console.log(
    "  Ouvrez http://localhost:3020/admin/leads pour vérifier.",
  );
}

main().catch((e) => {
  console.error("Échec seed démo :", e);
  process.exit(1);
});
