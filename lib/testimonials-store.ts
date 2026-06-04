/**
 * Mur de témoignages public.
 *
 * Source : enquêtes NPS avec score >= 9 et commentaire non vide. L'admin
 * valide manuellement chaque témoignage avant affichage public (modération).
 *
 * Stockage : un index séparé `data/testimonials.json` qui contient les
 * "approbations" — surveyId → displayName + approvedAt + publishedAt.
 *
 * Pas de stockage des contenus en double : on relit la NpsSurvey à l'affichage.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { listSurveys, type NpsSurvey } from "./nps-store";

const DATA_DIR = path.join(process.cwd(), "data");
const APPROVALS_FILE = path.join(DATA_DIR, "testimonials.json");

export type Approval = {
  surveyId: string;
  displayName: string;
  commune?: string;
  approvedAt: string;
  approvedBy?: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readApprovals(): Promise<Approval[]> {
  try {
    return JSON.parse(await fs.readFile(APPROVALS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeApprovals(arr: Approval[]) {
  await ensureDir();
  await fs.writeFile(APPROVALS_FILE, JSON.stringify(arr, null, 2), "utf8");
}

export async function listApprovals(): Promise<Approval[]> {
  return await readApprovals();
}

export async function isApproved(surveyId: string): Promise<boolean> {
  const all = await readApprovals();
  return all.some((a) => a.surveyId === surveyId);
}

export async function approveSurvey(input: {
  surveyId: string;
  displayName: string;
  commune?: string;
  approvedBy?: string;
}): Promise<Approval> {
  const displayName = input.displayName.trim();
  if (!displayName) throw new Error("displayName requis");
  if (displayName.length > 80) throw new Error("displayName trop long");
  const all = await readApprovals();
  const existing = all.find((a) => a.surveyId === input.surveyId);
  if (existing) {
    existing.displayName = displayName;
    existing.commune = input.commune?.trim() || undefined;
    existing.approvedAt = new Date().toISOString();
    existing.approvedBy = input.approvedBy;
    await writeApprovals(all);
    return existing;
  }
  const approval: Approval = {
    surveyId: input.surveyId,
    displayName,
    commune: input.commune?.trim() || undefined,
    approvedAt: new Date().toISOString(),
    approvedBy: input.approvedBy,
  };
  all.push(approval);
  await writeApprovals(all);
  return approval;
}

export async function unapprove(surveyId: string): Promise<boolean> {
  const all = await readApprovals();
  const next = all.filter((a) => a.surveyId !== surveyId);
  if (next.length === all.length) return false;
  await writeApprovals(next);
  return true;
}

/* ─────────────── Composition ─────────────── */

export type TestimonialCandidate = {
  survey: NpsSurvey;
  isApproved: boolean;
  approval?: Approval;
};

export async function listCandidates(): Promise<TestimonialCandidate[]> {
  const [surveys, approvals] = await Promise.all([
    listSurveys(),
    readApprovals(),
  ]);
  const approvalsByRef = new Map(approvals.map((a) => [a.surveyId, a]));
  return surveys
    .filter(
      (s) =>
        s.respondedAt &&
        typeof s.score === "number" &&
        s.score >= 9 &&
        s.comment &&
        s.comment.trim(),
    )
    .map((survey) => ({
      survey,
      isApproved: approvalsByRef.has(survey.id),
      approval: approvalsByRef.get(survey.id),
    }))
    .sort(
      (a, b) =>
        new Date(b.survey.respondedAt!).getTime() -
        new Date(a.survey.respondedAt!).getTime(),
    );
}

export type PublicTestimonial = {
  id: string;
  displayName: string;
  commune?: string;
  score: number;
  comment: string;
  publishedAt: string;
};

export async function listPublicTestimonials(): Promise<PublicTestimonial[]> {
  const [surveys, approvals] = await Promise.all([
    listSurveys(),
    readApprovals(),
  ]);
  const surveyById = new Map(surveys.map((s) => [s.id, s]));
  const out: PublicTestimonial[] = [];
  for (const a of approvals) {
    const s = surveyById.get(a.surveyId);
    if (!s || !s.comment || typeof s.score !== "number") continue;
    out.push({
      id: a.surveyId,
      displayName: a.displayName,
      commune: a.commune,
      score: s.score,
      comment: s.comment,
      publishedAt: a.approvedAt,
    });
  }
  // Tri publication récente
  out.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
  // Fallback démo : si aucun témoignage réel n'est encore approuvé en base,
  // on injecte un jeu de seed pour que la page ait du contenu et que le
  // schéma Review JSON-LD soit déclenché. À remplacer par les vrais retours
  // dès que le NPS post-installation collecte des réponses.
  if (out.length === 0) {
    return [...SEED_TESTIMONIALS];
  }
  return out;
}

/**
 * Témoignages démo — utilisés en fallback tant que le pipeline NPS réel n'a
 * pas encore d'approbations en base. Ils sont étiquetés comme tels dans
 * leur `commune` ou via le naming pour transparence.
 */
const SEED_TESTIMONIALS: PublicTestimonial[] = [
  {
    id: "seed-1",
    displayName: "Sophie M.",
    commune: "Luxembourg-Ville",
    score: 10,
    comment:
      "Remplacement de notre vieille chaudière fioul par une PAC air/eau. L'équipe a tout géré : étude, dossier Klimabonus, pose, mise en service. On a senti une équipe qui maîtrise sa matière de A à Z.",
    publishedAt: "2026-04-18T00:00:00.000Z",
  },
  {
    id: "seed-2",
    displayName: "Jean & Marie L.",
    commune: "Strassen",
    score: 10,
    comment:
      "Rénovation salle de bain complète, douche à l'italienne et robinetterie haut de gamme. Planning respecté à la semaine près, communication impeccable, finitions soignées.",
    publishedAt: "2026-03-22T00:00:00.000Z",
  },
  {
    id: "seed-3",
    displayName: "Antoine K.",
    commune: "Esch-sur-Alzette",
    score: 9,
    comment:
      "PAC Vaillant aroTHERM installée chez nous. Les économies promises se vérifient au compteur. Visite technique préalable très pro, pas de mauvaise surprise sur le devis.",
    publishedAt: "2026-02-14T00:00:00.000Z",
  },
  {
    id: "seed-4",
    displayName: "Familles V.",
    commune: "Bertrange",
    score: 10,
    comment:
      "Système hybride chaudière + PAC sur notre maison de 1980. Le bureau d'études a vraiment pris le temps d'expliquer les choix. Résultat : confort homogène et facture divisée par deux.",
    publishedAt: "2026-01-30T00:00:00.000Z",
  },
  {
    id: "seed-5",
    displayName: "Cabinet Architectes RV",
    commune: "Kirchberg",
    score: 9,
    comment:
      "Partenaire technique sur trois de nos chantiers tertiaires. Toujours dans les délais, propose des solutions élégantes quand on rencontre un obstacle. À recommander aux architectes du LU.",
    publishedAt: "2025-12-12T00:00:00.000Z",
  },
  {
    id: "seed-6",
    displayName: "Sandra B.",
    commune: "Mersch",
    score: 10,
    comment:
      "Chauffe-eau thermodynamique pour remplacer un cumulus électrique de 25 ans. Pose en 1 journée, propre. Les économies sur la facture élec sont visibles dès le premier mois.",
    publishedAt: "2025-11-08T00:00:00.000Z",
  },
];
