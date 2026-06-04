/**
 * Planning auto-calculé pour les techniciens.
 *
 * Modèle métier :
 *   - Un référentiel d'effectifs requis par type d'intervention
 *     (ex : "chaudière condensation" = 2 techs, "PAC standard" = 1 tech).
 *   - Une liste de techs avec leurs compétences (servicesCovered) et leur
 *     disponibilité par jour (calendrier des absences).
 *   - Une liste d'interventions à planifier (issues des leads convertis +
 *     visites entretien programmées).
 *
 * Algorithme (greedy avec priorisation urgence) :
 *   1. Trier les interventions par priorité : urgence > timeline serrée > date demandée
 *   2. Pour chaque intervention, depuis le jour souhaité avancer jour par jour :
 *      a. Récupérer les techs disponibles ce jour (non absent, non saturé)
 *      b. Filtrer par compétences requises (au moins une match)
 *      c. Si on a assez de techs pour l'effectif requis, planifier
 *      d. Sinon, essayer le jour suivant
 *   3. Si rien trouvé dans la fenêtre acceptable, marquer "À replanifier manuellement"
 *
 * Récal cul automatique en cas d'absence :
 *   - Marquer un tech comme indispo sur une période
 *   - Re-lancer l'algo sur les interventions affectées (qui avaient ce tech assigné)
 *   - Les autres interventions ne bougent pas
 *
 * V1 : pas de minimisation des temps de trajet ni de respect strict des
 * créneaux. C'est volontairement simple — un planning "défrichage" que
 * l'humain ajuste ensuite.
 */

export type ServiceTag =
  | "chaudiere"
  | "pac"
  | "clim"
  | "sanitaire"
  | "enr"
  | "depannage"
  | "entretien";

export type PriorityLevel = "urgent" | "haute" | "normale" | "basse";

/** Un tech disponible pour la planification. */
export type AvailableTech = {
  id: string;
  displayName: string;
  /** Compétences couvertes (services dont il sait s'occuper). */
  servicesCovered: ServiceTag[];
  /** Charge max par jour (nombre d'interventions). Défaut 3. */
  maxPerDay?: number;
  /** Jours d'absence (ISO YYYY-MM-DD). */
  absences?: string[];
};

/** Un type d'intervention avec effectif requis. */
export type InterventionTemplate = {
  /** Tag service principal. */
  service: ServiceTag;
  /** Libellé court (ex : "Pose chaudière condensation"). */
  label: string;
  /** Nombre de techs requis (1, 2, 3…). */
  requiredHeadcount: number;
  /** Durée estimée en heures. */
  estimatedHours: number;
};

/** Une intervention à planifier. */
export type InterventionToSchedule = {
  id: string;
  template: InterventionTemplate;
  /** Date souhaitée par le client (point de départ pour la recherche). */
  preferredDate: string; // ISO YYYY-MM-DD
  priority: PriorityLevel;
  /** Référence lead, si liée. */
  leadReference?: string;
  /** Titre lisible. */
  title: string;
};

export type Assignment = {
  interventionId: string;
  scheduledDate: string; // ISO YYYY-MM-DD
  assignedTechIds: string[];
  /** Décalage par rapport à la date préférée (en jours, positif si après). */
  shiftDays: number;
  /** Confiance : si on a EXACTEMENT le headcount requis. */
  fullStaffed: boolean;
};

export type PlanningResult = {
  /** Interventions planifiées avec succès. */
  assignments: Assignment[];
  /** Interventions impossibles à placer dans la fenêtre. */
  unassigned: { interventionId: string; reason: string }[];
  /** Charge par tech sur la période (id → nb interventions). */
  techLoad: Record<string, number>;
};

const PRIORITY_WEIGHT: Record<PriorityLevel, number> = {
  urgent: 0,
  haute: 1,
  normale: 2,
  basse: 3,
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDaysIso(iso: string, n: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

/**
 * Calcule un planning à partir des interventions et des techs.
 *
 * @param interventions Liste des interventions à placer
 * @param techs Liste des techs disponibles
 * @param options.maxShiftDays Fenêtre max de décalage (défaut 14 j)
 */
export function calculatePlanning(
  interventions: InterventionToSchedule[],
  techs: AvailableTech[],
  options: { maxShiftDays?: number } = {},
): PlanningResult {
  const maxShift = options.maxShiftDays ?? 14;
  const assignments: Assignment[] = [];
  const unassigned: PlanningResult["unassigned"] = [];
  const techLoad: Record<string, number> = {};
  /** Map "techId-date" → nb interventions ce jour-là. */
  const dailyLoad = new Map<string, number>();

  // Tri par priorité (urgent d'abord) puis par date préférée
  const sorted = [...interventions].sort((a, b) => {
    const pw = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    if (pw !== 0) return pw;
    return a.preferredDate.localeCompare(b.preferredDate);
  });

  for (const inter of sorted) {
    const required = inter.template.requiredHeadcount;
    const service = inter.template.service;
    let placed = false;

    for (let shift = 0; shift <= maxShift; shift++) {
      const tryDate = addDaysIso(inter.preferredDate, shift);
      // Tech disponibles ce jour (compétents + non absents + pas saturés)
      const candidates = techs
        .filter((t) => {
          if (t.absences?.includes(tryDate)) return false;
          if (!t.servicesCovered.includes(service)) return false;
          const load = dailyLoad.get(`${t.id}-${tryDate}`) ?? 0;
          if (load >= (t.maxPerDay ?? 3)) return false;
          return true;
        })
        // Préfère ceux moins chargés
        .sort(
          (a, b) =>
            (dailyLoad.get(`${a.id}-${tryDate}`) ?? 0) -
            (dailyLoad.get(`${b.id}-${tryDate}`) ?? 0),
        );

      if (candidates.length >= required) {
        const chosen = candidates.slice(0, required);
        for (const t of chosen) {
          dailyLoad.set(
            `${t.id}-${tryDate}`,
            (dailyLoad.get(`${t.id}-${tryDate}`) ?? 0) + 1,
          );
          techLoad[t.id] = (techLoad[t.id] ?? 0) + 1;
        }
        assignments.push({
          interventionId: inter.id,
          scheduledDate: tryDate,
          assignedTechIds: chosen.map((t) => t.id),
          shiftDays: shift,
          fullStaffed: true,
        });
        placed = true;
        break;
      }
    }

    if (!placed) {
      unassigned.push({
        interventionId: inter.id,
        reason: `Aucun jour disponible avec ${required} tech(s) compétent(s) en ${service} dans la fenêtre de ${maxShift} jours.`,
      });
    }
  }

  return { assignments, unassigned, techLoad };
}

/**
 * Recalcule UNIQUEMENT les interventions affectées par une nouvelle absence.
 * Utile quand un tech tombe malade : on déplace ses interventions plutôt que
 * de tout refaire.
 */
export function recalculateForAbsence(
  previousResult: PlanningResult,
  interventions: InterventionToSchedule[],
  techs: AvailableTech[],
  absentTechId: string,
  absentDates: string[],
  options: { maxShiftDays?: number } = {},
): PlanningResult {
  // Identifie les assignations touchées : tech dans assignedTechIds ET date dans absentDates
  const affected = new Set<string>();
  for (const a of previousResult.assignments) {
    if (
      a.assignedTechIds.includes(absentTechId) &&
      absentDates.includes(a.scheduledDate)
    ) {
      affected.add(a.interventionId);
    }
  }

  // Marque l'absence sur le tech
  const updatedTechs = techs.map((t) =>
    t.id === absentTechId
      ? { ...t, absences: [...(t.absences ?? []), ...absentDates] }
      : t,
  );

  // Garde les assignations non affectées + reconstruit dailyLoad
  const kept = previousResult.assignments.filter(
    (a) => !affected.has(a.interventionId),
  );
  const dailyLoad = new Map<string, number>();
  for (const a of kept) {
    for (const tid of a.assignedTechIds) {
      dailyLoad.set(
        `${tid}-${a.scheduledDate}`,
        (dailyLoad.get(`${tid}-${a.scheduledDate}`) ?? 0) + 1,
      );
    }
  }

  // Re-planifier UNIQUEMENT les interventions touchées
  const toReschedule = interventions.filter((i) => affected.has(i.id));
  const re = calculatePlanning(toReschedule, updatedTechs, options);

  const techLoad: Record<string, number> = {};
  for (const a of kept) {
    for (const t of a.assignedTechIds) {
      techLoad[t] = (techLoad[t] ?? 0) + 1;
    }
  }
  for (const [k, v] of Object.entries(re.techLoad)) {
    techLoad[k] = (techLoad[k] ?? 0) + v;
  }

  return {
    assignments: [...kept, ...re.assignments],
    unassigned: re.unassigned,
    techLoad,
  };
}

/** Catalogue par défaut des types d'intervention (le client peut éditer). */
export const DEFAULT_TEMPLATES: InterventionTemplate[] = [
  {
    service: "chaudiere",
    label: "Pose chaudière condensation",
    requiredHeadcount: 2,
    estimatedHours: 6,
  },
  {
    service: "chaudiere",
    label: "Remplacement chaudière",
    requiredHeadcount: 2,
    estimatedHours: 8,
  },
  {
    service: "pac",
    label: "Installation PAC air/eau",
    requiredHeadcount: 2,
    estimatedHours: 10,
  },
  {
    service: "pac",
    label: "Entretien PAC",
    requiredHeadcount: 1,
    estimatedHours: 2,
  },
  {
    service: "clim",
    label: "Pose climatisation mono-split",
    requiredHeadcount: 1,
    estimatedHours: 4,
  },
  {
    service: "clim",
    label: "Pose climatisation multi-split",
    requiredHeadcount: 2,
    estimatedHours: 6,
  },
  {
    service: "sanitaire",
    label: "Rénovation salle de bain",
    requiredHeadcount: 2,
    estimatedHours: 16,
  },
  {
    service: "enr",
    label: "Pose photovoltaïque",
    requiredHeadcount: 3,
    estimatedHours: 8,
  },
  {
    service: "depannage",
    label: "Intervention dépannage",
    requiredHeadcount: 1,
    estimatedHours: 2,
  },
  {
    service: "entretien",
    label: "Visite entretien annuelle",
    requiredHeadcount: 1,
    estimatedHours: 1.5,
  },
];
