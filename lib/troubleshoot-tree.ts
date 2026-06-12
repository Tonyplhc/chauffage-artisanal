/**
 * Arbre de questions pour auto-diagnostic dépannage HVAC.
 *
 * Structure : un arbre de questions où chaque réponse mène à une autre
 * question ou à une recommandation finale.
 *
 * Recommandation finale = { gravity, title, body, action }
 *   - gravity : "ok" | "moderate" | "urgent" — code couleur
 *   - action : "self-fix" | "call-soon" | "call-urgent" | "emergency"
 *
 * Discipline éditoriale :
 *   - on N'ENGAGE PAS le client à un coût/délai précis
 *   - on identifie quand une intervention pro est nécessaire
 *   - les conseils "auto-fix" restent dans le périmètre sans danger
 *     (vérifier pression manomètre, dépoussiérer filtre clim, etc.)
 *   - en cas de doute → escalade pro
 */

export type Severity = "ok" | "moderate" | "urgent";
export type RecommendedAction = "self-fix" | "call-soon" | "call-urgent" | "emergency";

export type Recommendation = {
  severity: Severity;
  title: string;
  body: string;
  action: RecommendedAction;
  /** Conseil d'action concret (1 ligne). */
  cta: string;
};

export type Question = {
  id: string;
  prompt: string;
  options: {
    label: string;
    /** Nœud suivant : autre question ou recommandation finale. */
    next: { questionId?: string; recommendation?: Recommendation };
  }[];
};

const FINAL: Record<string, Recommendation> = {
  emergency_gas: {
    severity: "urgent",
    title: "Évacuation immédiate",
    body:
      "Odeur de gaz détectée. Ne tentez aucune manipulation électrique. Ouvrez les fenêtres, fermez le robinet de gaz si accessible, sortez du logement et appelez les secours.",
    action: "emergency",
    cta: "Appeler le 112 (urgence)",
  },
  emergency_leak: {
    severity: "urgent",
    title: "Fuite importante détectée",
    body:
      "Coupez l'eau au robinet principal et l'électricité si l'eau est proche d'une prise. Appelez-nous immédiatement pour une intervention d'urgence.",
    action: "emergency",
    cta: "Nous appeler en urgence",
  },
  call_urgent_heat: {
    severity: "urgent",
    title: "Intervention rapide nécessaire",
    body:
      "Votre système ne chauffe plus en pleine saison de chauffe. Selon notre disponibilité, nous intervenons sous 24-48 h.",
    action: "call-urgent",
    cta: "Demander une intervention",
  },
  call_soon_chaudiere: {
    severity: "moderate",
    title: "Visite technique conseillée",
    body:
      "Les symptômes décrits évoquent un défaut d'entretien ou un composant fatigué. Une visite technicien permet de poser le diagnostic.",
    action: "call-soon",
    cta: "Prendre rendez-vous",
  },
  call_soon_clim: {
    severity: "moderate",
    title: "Intervention recommandée",
    body:
      "Les indices pointent vers un manque de fluide frigorigène ou un encrassement avancé. Intervention pro nécessaire (recharge fluide réglementée).",
    action: "call-soon",
    cta: "Prendre rendez-vous",
  },
  self_fix_filter: {
    severity: "ok",
    title: "Vous pouvez le faire vous-même",
    body:
      "Le filtre de votre climatisation/PAC se dépoussière facilement. Coupez l'appareil, retirez le filtre, passez-le sous l'eau tiède, séchez à plat, remettez en place. À refaire tous les 3-6 mois.",
    action: "self-fix",
    cta: "Tutoriel filtre dans nos ressources",
  },
  self_fix_pressure: {
    severity: "ok",
    title: "Vérification simple",
    body:
      "La pression de votre chaudière doit être entre 1 et 1.5 bar à froid. Si elle est en dessous, ouvrez la vanne de remplissage (en boucle) jusqu'à atteindre ~1.2 bar, puis refermez. Au-delà de 2.5 bar, purgez les radiateurs.",
    action: "self-fix",
    cta: "Vérifier le manomètre",
  },
  monitor: {
    severity: "ok",
    title: "Pas d'urgence immédiate",
    body:
      "Surveillez l'évolution. Si la situation se dégrade (bruit, perte de performance, fuite), recontactez-nous. Pensez à votre visite d'entretien annuelle si pas faite.",
    action: "call-soon",
    cta: "Planifier l'entretien annuel",
  },
};

export const QUESTIONS: Record<string, Question> = {
  root: {
    id: "root",
    prompt: "Quel est le souci ?",
    options: [
      { label: "Plus de chauffage / eau chaude", next: { questionId: "no_heat" } },
      { label: "Climatisation : ne refroidit plus", next: { questionId: "clim_warm" } },
      { label: "Fuite d'eau visible", next: { questionId: "leak" } },
      { label: "Odeur de gaz", next: { recommendation: FINAL.emergency_gas } },
      { label: "Bruit anormal", next: { questionId: "noise" } },
    ],
  },
  no_heat: {
    id: "no_heat",
    prompt: "La chaudière / PAC fonctionne mais le chauffage est tiède, ou tout est éteint ?",
    options: [
      { label: "Tout est éteint, écran noir", next: { questionId: "no_power" } },
      { label: "Allumée mais chauffage tiède", next: { questionId: "lukewarm" } },
      { label: "Eau chaude OK mais radiateurs froids", next: { recommendation: FINAL.self_fix_pressure } },
      { label: "Code erreur affiché", next: { recommendation: FINAL.call_soon_chaudiere } },
    ],
  },
  no_power: {
    id: "no_power",
    prompt: "Avez-vous vérifié le disjoncteur électrique de la chaudière ?",
    options: [
      { label: "Oui, il est en marche", next: { recommendation: FINAL.call_urgent_heat } },
      { label: "Disjoncteur tombé — je le réarme", next: { recommendation: FINAL.monitor } },
      { label: "Je ne sais pas où il est", next: { recommendation: FINAL.call_soon_chaudiere } },
    ],
  },
  lukewarm: {
    id: "lukewarm",
    prompt: "Quand avez-vous fait votre dernière purge des radiateurs ?",
    options: [
      { label: "Jamais ou plus d'un an", next: { recommendation: FINAL.self_fix_pressure } },
      { label: "Récemment", next: { recommendation: FINAL.call_soon_chaudiere } },
    ],
  },
  clim_warm: {
    id: "clim_warm",
    prompt: "Le filtre a-t-il été nettoyé récemment ?",
    options: [
      { label: "Jamais", next: { recommendation: FINAL.self_fix_filter } },
      { label: "Récemment et le souci persiste", next: { recommendation: FINAL.call_soon_clim } },
    ],
  },
  leak: {
    id: "leak",
    prompt: "Quelle est l'ampleur de la fuite ?",
    options: [
      { label: "Goutte à goutte sous la chaudière", next: { recommendation: FINAL.call_soon_chaudiere } },
      { label: "Petite flaque qui se reforme", next: { recommendation: FINAL.call_soon_chaudiere } },
      { label: "Eau qui coule en continu", next: { recommendation: FINAL.emergency_leak } },
    ],
  },
  noise: {
    id: "noise",
    prompt: "Quel type de bruit ?",
    options: [
      { label: "Sifflement aigu", next: { recommendation: FINAL.call_soon_chaudiere } },
      { label: "Claquements dans les radiateurs", next: { recommendation: FINAL.self_fix_pressure } },
      { label: "Vibration constante", next: { recommendation: FINAL.call_soon_chaudiere } },
      { label: "Bruit d'ébullition", next: { recommendation: FINAL.call_urgent_heat } },
    ],
  },
};

// Échelle de sévérité aux couleurs charte : bleu (rien d'alarmant) →
// terracotta (à surveiller) → brique (urgent). Vert/rouge restent réservés
// aux données financières (Règle N°6).
export const SEVERITY_LABEL: Record<Severity, { label: string; color: string }> = {
  ok: { label: "OK", color: "#0B57A0" },
  moderate: { label: "Modéré", color: "#C24A2C" },
  urgent: { label: "Urgent", color: "#A2131A" },
};
