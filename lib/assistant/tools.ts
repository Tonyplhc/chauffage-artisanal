/**
 * OUTILS DE L'ASSISTANT IA — le pont entre Claude et les moteurs déterministes.
 *
 * Charte Règle N°4 : l'IA ne calcule JAMAIS. Chaque chiffre (€, kWh, aides,
 * créneaux) sort d'un de ces outils, qui appellent les moteurs du référentiel
 * (Règle N°5 : source unique — mêmes formules que /estimation et les
 * simulateurs). Claude orchestre, questionne, explique, rassure.
 *
 * Server-only : booking-store utilise node:fs.
 */
import type Anthropic from "@anthropic-ai/sdk";
import {
  estimerProjet,
  computeAides,
  COMMUNES_LU,
  type ChauffageActuel,
  type Logement,
  type EquipementAide,
  type TypeLogement,
} from "@/lib/referentiel";
import { listAvailableSlots, createBooking } from "@/lib/booking-store";

/* ── Définitions (descriptions prescriptives : QUAND appeler, pas juste quoi) ── */

export const ASSISTANT_TOOLS: Anthropic.Tool[] = [
  {
    name: "estimer_projet",
    description:
      "Calcule l'estimation complète d'un passage à la pompe à chaleur air/eau : économie annuelle, gain sur 10 ans, budget d'installation, forfait Klimabonus 2026, reste à charge, ROI. APPELLE CET OUTIL dès que tu connais les 4 informations (commune, type de logement, chauffage actuel, facture annuelle €) — n'avance JAMAIS un montant sans lui. Si une information manque, pose la question au client d'abord.",
    input_schema: {
      type: "object",
      properties: {
        commune: {
          type: "string",
          description:
            "Commune du Luxembourg (ex. 'Luxembourg', 'Mersch', 'Esch-sur-Alzette'). Si la commune n'est pas dans la liste officielle, utiliser 'Autre'.",
        },
        logement: { type: "string", enum: ["maison", "appartement"] },
        chauffage: {
          type: "string",
          enum: ["Mazout", "Gaz", "Électrique", "Bois", "Autre"],
          description: "Énergie de chauffage actuelle du client.",
        },
        facture_annuelle: {
          type: "number",
          description: "Facture de chauffage annuelle actuelle en euros (ordre de grandeur accepté).",
        },
      },
      required: ["commune", "logement", "chauffage", "facture_annuelle"],
    },
  },
  {
    name: "calculer_aides",
    description:
      "Détaille les aides luxembourgeoises pour un équipement donné : forfait Klimabonus 2026 (vérifié sur guichet.public.lu), aide communale Klimapakt, TVA 3 %, Enoprimes, conditions. APPELLE CET OUTIL quand le client demande les aides pour un équipement précis (PAC air/eau, géothermie, biomasse, solaire thermique) ou veut comparer les forfaits — ne cite JAMAIS un montant d'aide de mémoire.",
    input_schema: {
      type: "object",
      properties: {
        equipement: {
          type: "string",
          enum: ["pac-air-eau", "pac-geothermique", "biomasse", "solaire-thermique"],
        },
        logement: {
          type: "string",
          enum: ["unifamilial", "collectif"],
          description: "unifamilial = maison · collectif = appartement.",
        },
        remplacement_fossile: {
          type: "boolean",
          description: "true si le projet remplace une chaudière mazout ou gaz (forfait majoré).",
        },
        neuf: { type: "boolean", description: "true uniquement pour une construction neuve." },
        commune: { type: "string" },
        annee_construction: {
          type: "number",
          description: "Année de construction du logement, si connue (détermine la TVA 3 %).",
        },
      },
      required: ["equipement", "logement", "remplacement_fossile"],
    },
  },
  {
    name: "lister_creneaux",
    description:
      "Liste les créneaux réellement disponibles pour une visite technique gratuite (45 min, au domicile du client, lun-ven 9h-17h). APPELLE CET OUTIL avant de proposer un rendez-vous — ne propose JAMAIS une date/heure de toi-même.",
    input_schema: {
      type: "object",
      properties: {
        jours: {
          type: "number",
          description: "Horizon en jours (défaut 7, max 14).",
        },
      },
      required: [],
    },
  },
  {
    name: "reserver_visite",
    description:
      "Réserve DÉFINITIVEMENT un créneau de visite technique. N'APPELLE CET OUTIL QU'APRÈS avoir : (1) listé les créneaux via lister_creneaux, (2) collecté nom complet, email et téléphone, (3) affiché un récapitulatif (date, heure, coordonnées) et (4) reçu un OUI explicite du client. Jamais de réservation implicite.",
    input_schema: {
      type: "object",
      properties: {
        slot_iso: {
          type: "string",
          description: "Le champ 'iso' exact du créneau choisi, tel que retourné par lister_creneaux.",
        },
        nom: { type: "string", description: "Prénom et nom du client." },
        email: { type: "string" },
        telephone: { type: "string" },
        commune: { type: "string" },
        note: {
          type: "string",
          description: "Contexte utile pour le technicien (chauffage actuel, facture, attentes).",
        },
      },
      required: ["slot_iso", "nom", "email", "telephone"],
    },
  },
];

/* ── Exécution ── */

const CHAUFFAGES: ChauffageActuel[] = ["Mazout", "Gaz", "Électrique", "Bois", "Autre"];

function normCommune(c: string): string {
  const found = COMMUNES_LU.find((x) => x.localeCompare(c, "fr", { sensitivity: "base" }) === 0);
  return found ?? "Autre";
}

export async function runAssistantTool(name: string, input: unknown): Promise<string> {
  const args = (input ?? {}) as Record<string, unknown>;
  try {
    switch (name) {
      case "estimer_projet": {
        const chauffage = CHAUFFAGES.includes(args.chauffage as ChauffageActuel)
          ? (args.chauffage as ChauffageActuel)
          : "Autre";
        const facture = Math.min(20000, Math.max(300, Number(args.facture_annuelle) || 0));
        if (!facture) return JSON.stringify({ erreur: "facture_annuelle manquante ou invalide" });
        const r = estimerProjet({
          commune: normCommune(String(args.commune ?? "Autre")),
          logement: (args.logement === "appartement" ? "appartement" : "maison") as Logement,
          chauffage,
          factureAnnuelle: facture,
        });
        return JSON.stringify({
          ...r,
          avertissement:
            "Chiffres estimés (prix énergie LU, SCOP 3,5, forfaits Klimabonus 2026 vérifiés). Montant exact confirmé lors de l'étude — accord de principe à demander AVANT signature du devis.",
        });
      }
      case "calculer_aides": {
        const r = computeAides({
          equipement: String(args.equipement) as EquipementAide,
          logement: (args.logement === "collectif" ? "collectif" : "unifamilial") as TypeLogement,
          remplacementFossile: Boolean(args.remplacement_fossile),
          neuf: args.neuf === true,
          commune: args.commune ? normCommune(String(args.commune)) : undefined,
          anneeConstruction:
            typeof args.annee_construction === "number" ? args.annee_construction : undefined,
        });
        return JSON.stringify(r);
      }
      case "lister_creneaux": {
        const jours = Math.min(14, Math.max(1, Number(args.jours) || 7));
        const { slots } = await listAvailableSlots(jours);
        return JSON.stringify({
          creneaux: slots.slice(0, 24),
          note: "Visite technique gratuite, 45 min, au domicile du client. Un humain confirme par email ; le créneau peut être ajusté.",
        });
      }
      case "reserver_visite": {
        const booking = await createBooking({
          slotIso: String(args.slot_iso),
          durationMin: 45,
          purpose: "visite-technique",
          fullName: String(args.nom ?? "").trim(),
          email: String(args.email ?? "").trim(),
          phone: String(args.telephone ?? "").trim(),
          commune: args.commune ? normCommune(String(args.commune)) : undefined,
          notes: `Réservé via l'assistant IA. ${String(args.note ?? "")}`.slice(0, 800),
        });
        return JSON.stringify({
          ok: true,
          reservation: { id: booking.id, slotIso: booking.slotIso, statut: booking.status },
          message: "Créneau réservé. Confirmation envoyée par email ; si le créneau doit bouger, l'équipe appelle avant.",
        });
      }
      default:
        return JSON.stringify({ erreur: `Outil inconnu : ${name}` });
    }
  } catch (e) {
    return JSON.stringify({
      erreur: e instanceof Error ? e.message : "Erreur d'exécution de l'outil",
    });
  }
}
