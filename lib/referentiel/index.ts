/**
 * SOURCE UNIQUE DE VÉRITÉ — Chauffage Artisanal (Charte Règle N°5).
 *
 * Tous les calculs (estimateur, assistant IA, simulateurs) lisent leurs données
 * ici. Avant d'ajouter une fonctionnalité qui manipule un montant : vérifier
 * qu'elle passe par ce référentiel.
 *
 * Contenu :
 *   • aides            — moteur d'aides déterministe (Klimabonus 2026 + communal + TVA + Enoprimes)
 *   • aides-communales — référentiel Klimapakt par commune
 *   • prix-energie     — prix €/kWh LU (gaz/fioul/élec/PV)
 *
 * À venir (mêmes principes : daté, sourcé, versionné) :
 *   • catalogue-produits (PAC/chaudières — gammes, puissances, SCOP, fourchettes prix)
 *   • dimensionnement (coeff. déperdition, ΔT, heures — depuis lib/pac-sizing.ts)
 */
export * from "./aides";
export * from "./aides-communales";
export * from "./prix-energie";
export * from "./estimation";

export const REFERENTIEL_VERSION = "2026.1";
export const REFERENTIEL_LAST_UPDATED = "2026-01-06";
