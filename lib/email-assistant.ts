/**
 * Email assistant — suggestions de réponses contextuelles.
 *
 * IMPORTANT : ce module n'est pas une IA générative. C'est un moteur de règles
 * qui pioche dans des templates écrits à la main + variables interpolées
 * (lead, brand, contexte). Le but : proposer 3-5 brouillons pertinents que
 * l'admin peut envoyer tels quels ou retoucher.
 *
 * Pourquoi pas un LLM ? Trois raisons :
 *   1. Pas de coût récurrent ni dépendance externe
 *   2. Le ton de la marque reste maîtrisé (templates relus par le métier)
 *   3. RGPD : les données lead ne sortent jamais du serveur
 *
 * Quand un LLM aura du sens (rédaction libre, reformulation), il pourra
 * brancher en option avec un flag .env — la signature de ce module reste
 * stable.
 *
 * Heuristiques de matching :
 *   - statut courant
 *   - âge depuis dernière transition / création
 *   - sentiment du dernier message client (chat / commentaire)
 *   - service demandé
 *   - source d'acquisition
 *   - assignation présente
 *
 * Sortie : liste de {id, title, body, tone, why} triée par pertinence
 * descendante. Le call-site (UI) affiche, l'admin clique → coller dans email
 * template ou chat.
 */

import type { LeadRecord } from "./devis-schema";
import { analyzeSentiment } from "./sentiment";
import { getBrand } from "./brand-settings";

export type SuggestionTone = "neutre" | "chaleureux" | "ferme" | "rassurant";

export type EmailSuggestion = {
  id: string;
  title: string;
  /** Sujet email proposé. */
  subject: string;
  /** Corps du message (texte brut, retours à la ligne préservés). */
  body: string;
  tone: SuggestionTone;
  /** Score de pertinence (0..100) pour le tri. */
  relevance: number;
  /** Explication courte pourquoi cette suggestion. */
  why: string;
};

export type AssistantContext = {
  lead: LeadRecord;
  /** Dernier message reçu côté chat client (optionnel). */
  lastClientMessage?: string;
  /** Date ISO du dernier événement client (chat / interaction). */
  lastClientMessageAt?: string;
  /** Liste des dernières actions/notes admin (pour éviter de re-suggérer). */
  recentAdminActions?: string[];
};

const SERVICE_HINTS: Record<string, string> = {
  chauffage: "votre projet de chauffage",
  pac: "votre projet de pompe à chaleur",
  clim: "votre projet de climatisation",
  sanitaire: "votre projet sanitaire",
  enr: "votre projet énergies renouvelables",
  depannage: "votre demande de dépannage",
  autre: "votre projet",
};

function daysSince(iso: string | undefined): number {
  if (!iso) return 0;
  const d = new Date(iso).getTime();
  if (!Number.isFinite(d)) return 0;
  return Math.floor((Date.now() - d) / (24 * 3600 * 1000));
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function interpolate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_m, k) => vars[k] ?? `{{${k}}}`);
}

/**
 * Produit jusqu'à 6 suggestions classées par pertinence pour le contexte donné.
 *
 * L'algorithme est volontairement déterministe : mêmes entrées → mêmes
 * sorties. Aucun appel réseau.
 */
export async function suggestEmailReplies(
  ctx: AssistantContext,
): Promise<EmailSuggestion[]> {
  const brand = await getBrand();
  const { lead, lastClientMessage, lastClientMessageAt } = ctx;

  const vars: Record<string, string> = {
    "lead.firstName": firstName(lead.fullName),
    "lead.fullName": lead.fullName,
    "lead.reference": lead.reference,
    "lead.commune": lead.commune,
    "lead.serviceHint": SERVICE_HINTS[lead.service] ?? "votre projet",
    "brand.name": brand.name,
    "brand.phone": brand.contactPhone ?? "",
    "brand.email": brand.contactEmail ?? "",
  };

  const sentiment = lastClientMessage
    ? analyzeSentiment(lastClientMessage)
    : null;
  const daysSinceSubmit = daysSince(lead.submittedAt);
  const daysSinceClient = lastClientMessageAt
    ? daysSince(lastClientMessageAt)
    : null;
  const lastTransition = lead.statusHistory?.[lead.statusHistory.length - 1];
  const daysInStatus = lastTransition
    ? daysSince(lastTransition.at)
    : daysSinceSubmit;

  const out: EmailSuggestion[] = [];

  // ── Branche 1 : statut "nouveau"
  if (lead.status === "nouveau") {
    out.push({
      id: "accuse-reception",
      title: "Accusé de réception immédiat",
      subject: `Votre demande {{lead.reference}} a bien été reçue`,
      tone: "chaleureux",
      relevance: daysSinceSubmit <= 1 ? 95 : 60,
      why: "Statut nouveau, premier contact à confirmer.",
      body: `Bonjour {{lead.firstName}},

Merci pour votre demande concernant {{lead.serviceHint}}.

Nous avons bien reçu votre dossier (référence {{lead.reference}}) et un membre de notre équipe va l'étudier rapidement. Nous reviendrons vers vous sous 48 h ouvrées pour convenir d'un échange technique ou planifier une visite sur place si nécessaire.

Si votre situation est urgente, vous pouvez nous joindre directement au {{brand.phone}}.

À très vite,
L'équipe {{brand.name}}`,
    });

    if (daysSinceSubmit >= 2) {
      out.push({
        id: "premiere-relance-douce",
        title: "Première relance douce",
        subject: `Nous étudions {{lead.serviceHint}} — un mot pour faire le point`,
        tone: "chaleureux",
        relevance: 80,
        why: `Lead créé il y a ${daysSinceSubmit} j, pas encore contacté.`,
        body: `Bonjour {{lead.firstName}},

Nous étudions actuellement votre demande ({{lead.reference}}) concernant {{lead.serviceHint}}. Pour nous permettre d'avancer au plus juste, auriez-vous une dizaine de minutes cette semaine pour un échange téléphonique ?

Nous pourrons valider ensemble les points clés du projet et convenir d'une visite si nécessaire.

Bien à vous,
{{brand.name}}`,
      });
    }
  }

  // ── Branche 2 : statut "contacte" — devis à préparer
  if (lead.status === "contacte") {
    out.push({
      id: "confirmation-visite",
      title: "Proposition de créneau de visite",
      subject: `Visite technique pour {{lead.serviceHint}}`,
      tone: "neutre",
      relevance: 85,
      why: "Premier contact effectué, étape logique = visite.",
      body: `Bonjour {{lead.firstName}},

Suite à notre échange, je vous propose deux créneaux pour la visite technique chez vous, à {{lead.commune}} :

  • [créneau 1]
  • [créneau 2]

La visite prend en général 30 à 45 minutes. Elle nous permet de valider les contraintes techniques et de vous remettre un devis précis sous quelques jours.

Quel créneau vous conviendrait le mieux ? Si aucun ne fonctionne, dites-moi quand vous êtes disponible cette semaine ou la suivante.

Cordialement,
{{brand.name}}`,
    });

    if (daysInStatus >= 5) {
      out.push({
        id: "relance-rdv",
        title: "Relance prise de rendez-vous",
        subject: `Reprise de contact — projet {{lead.reference}}`,
        tone: "neutre",
        relevance: 78,
        why: `Statut "contacté" depuis ${daysInStatus} j sans suite.`,
        body: `Bonjour {{lead.firstName}},

Je reviens vers vous concernant votre projet ({{lead.reference}}). Pour avancer dans les meilleurs délais, j'aimerais bloquer un créneau de visite cette semaine ou la suivante.

Avez-vous une préférence (matin / fin de journée) ? Si le projet est mis en pause, dites-le moi simplement — nous garderons le dossier ouvert sans vous solliciter.

Bien cordialement,
{{brand.name}}`,
      });
    }
  }

  // ── Branche 3 : "devis_envoye"
  if (lead.status === "devis_envoye") {
    if (daysInStatus <= 3) {
      out.push({
        id: "verification-reception-devis",
        title: "Vérification réception devis",
        subject: `Bien reçu notre devis pour {{lead.serviceHint}} ?`,
        tone: "neutre",
        relevance: 90,
        why: "Devis envoyé récemment, vérifier la bonne réception.",
        body: `Bonjour {{lead.firstName}},

Je voulais m'assurer que vous avez bien reçu notre devis pour {{lead.serviceHint}}. Parfois ces emails atterrissent dans les indésirables.

Avez-vous des questions sur le périmètre, les délais ou le financement (aides Klimabonus, étalement) ? Je peux aussi vous appeler 10 minutes si c'est plus simple.

Cordialement,
{{brand.name}}`,
      });
    }
    if (daysInStatus >= 7 && daysInStatus < 21) {
      out.push({
        id: "relance-devis-aides",
        title: "Relance devis — angle aides énergie",
        subject: `Aides énergie pour votre projet {{lead.reference}}`,
        tone: "chaleureux",
        relevance: 86,
        why: `Devis envoyé il y a ${daysInStatus} j, sans réponse.`,
        body: `Bonjour {{lead.firstName}},

Je reviens vers vous concernant votre devis ({{lead.reference}}). Selon votre situation et l'équipement choisi, des aides existent côté Luxembourg (Klimabonus, exonérations TVA selon le bâtiment) — j'ai peut-être omis de vous les chiffrer précisément.

Souhaitez-vous que nous fassions un point ensemble sur le budget net après aides ? Cela ne prend que quelques minutes au téléphone.

Bien à vous,
{{brand.name}}`,
      });
    }
    if (daysInStatus >= 21) {
      out.push({
        id: "relance-finale-devis",
        title: "Relance finale (avant clôture dossier)",
        subject: `Dossier {{lead.reference}} — faut-il garder le devis ouvert ?`,
        tone: "ferme",
        relevance: 82,
        why: `Devis sans réponse depuis ${daysInStatus} j — clarifier l'intention.`,
        body: `Bonjour {{lead.firstName}},

Sans nouvelles de votre part depuis l'envoi du devis ({{lead.reference}}), je me permets une dernière relance avant de clôturer le dossier.

Trois possibilités me viennent en tête :
  1. Le projet est confirmé mais retardé — dites-moi à quelle échéance le reprendre.
  2. Vous avez choisi un autre prestataire — pas de souci, un mot pour confirmer.
  3. Le périmètre ou le budget ne convient pas — nous pouvons en discuter.

Une simple ligne de réponse suffit. Merci d'avance,
{{brand.name}}`,
      });
    }
  }

  // ── Branche 4 : "converti" — onboarding chantier
  if (lead.status === "converti") {
    out.push({
      id: "remerciement-converti",
      title: "Remerciement + prochaines étapes",
      subject: `Bienvenue parmi nos clients — projet {{lead.reference}}`,
      tone: "chaleureux",
      relevance: 88,
      why: "Lead converti, fluidifier l'onboarding chantier.",
      body: `Bonjour {{lead.firstName}},

Merci pour votre confiance — nous sommes ravis de démarrer votre projet ({{lead.reference}}).

Voici les prochaines étapes :
  1. Validation des dates d'intervention sous 5 jours ouvrés
  2. Commande du matériel et coordination avec nos partenaires
  3. Visite préparatoire si nécessaire avant le démarrage

Je reviens vers vous très vite avec un calendrier prévisionnel précis. D'ici là, n'hésitez pas si vous avez la moindre question.

Bien cordialement,
{{brand.name}}`,
    });
  }

  // ── Branche 5 : "perdu" — clôture polie
  if (lead.status === "perdu") {
    out.push({
      id: "cloture-perdu-respect",
      title: "Clôture respectueuse",
      subject: `Bonne continuation pour votre projet`,
      tone: "neutre",
      relevance: 65,
      why: "Lead perdu, laisser la porte ouverte sans relancer.",
      body: `Bonjour {{lead.firstName}},

Bien noté — nous clôturons le dossier {{lead.reference}}. Merci d'avoir pris le temps de nous consulter.

Si vos plans évoluent dans les mois à venir, ou si vous avez besoin d'un avis technique sur un autre sujet, n'hésitez pas à revenir vers nous.

Bonne continuation,
{{brand.name}}`,
    });
  }

  // ── Branche 6 : sentiment négatif détecté
  if (sentiment && sentiment.label === "negative") {
    out.push({
      id: "rassurer-mecontentement",
      title: "Désamorcer un mécontentement",
      subject: `Votre message — nous prenons cela très au sérieux`,
      tone: "rassurant",
      relevance: 92,
      why: "Sentiment négatif détecté dans le dernier message client.",
      body: `Bonjour {{lead.firstName}},

Je vous remercie d'avoir pris le temps de nous écrire. Je comprends votre frustration et je tiens à ce que nous trouvions une solution rapidement.

Pouvons-nous convenir d'un échange téléphonique aujourd'hui ou demain ? Cela me permettra de comprendre précisément la situation et de vous proposer une suite concrète, plutôt qu'un échange par email qui peut s'éterniser.

Je suis joignable au {{brand.phone}}. Si vous préférez que je vous appelle, indiquez-moi un créneau qui vous convient.

Bien cordialement,
{{brand.name}}`,
    });
  }

  // ── Branche 7 : sentiment positif détecté → encourager NPS / témoignage
  if (sentiment && sentiment.label === "positive" && lead.status === "converti") {
    out.push({
      id: "encourager-temoignage",
      title: "Demander un témoignage",
      subject: `Votre retour ferait toute la différence`,
      tone: "chaleureux",
      relevance: 75,
      why: "Sentiment positif + statut converti — moment idéal pour témoignage.",
      body: `Bonjour {{lead.firstName}},

Votre message m'a fait très plaisir — c'est exactement ce que nous cherchons à offrir.

Accepteriez-vous de partager publiquement votre expérience ? Quelques lignes sur la qualité de l'intervention nous aident énormément à rassurer les futurs clients qui hésitent.

Vous pouvez nous écrire en direct (je publierai avec votre accord) ou laisser un avis Google si c'est plus simple. Aucune obligation bien sûr.

Encore merci pour votre confiance,
{{brand.name}}`,
    });
  }

  // ── Branche 8 : silence prolongé client (>14j depuis dernier message)
  if (daysSinceClient !== null && daysSinceClient > 14 && lead.status !== "perdu" && lead.status !== "converti") {
    out.push({
      id: "check-in-silence",
      title: "Check-in après silence prolongé",
      subject: `On reste à votre disposition — {{lead.reference}}`,
      tone: "neutre",
      relevance: 70,
      why: `Silence côté client depuis ${daysSinceClient} j.`,
      body: `Bonjour {{lead.firstName}},

Cela fait quelque temps que nous n'avons pas échangé sur votre projet ({{lead.reference}}). Je voulais simplement vous faire savoir que le dossier reste ouvert de notre côté.

Si vous voulez le reprendre, dites-moi simplement où vous en êtes. Si vous avez choisi une autre voie, pas de souci — un mot pour confirmer et nous clôturons proprement.

Bien à vous,
{{brand.name}}`,
    });
  }

  // ── Branche 9 : source dépannage → ton plus urgent
  if (lead.service === "depannage" && lead.status === "nouveau") {
    // Remplace l'accusé-réception générique par une variante urgence
    const idx = out.findIndex((s) => s.id === "accuse-reception");
    if (idx !== -1) out.splice(idx, 1);
    out.push({
      id: "depannage-prise-charge",
      title: "Prise en charge dépannage immédiate",
      subject: `Dépannage {{lead.reference}} — nous vous rappelons`,
      tone: "rassurant",
      relevance: 98,
      why: "Service = dépannage, urgence implicite.",
      body: `Bonjour {{lead.firstName}},

Nous avons bien reçu votre demande de dépannage ({{lead.reference}}). Un technicien va vous rappeler dans l'heure pour qualifier la situation et organiser l'intervention.

Si la situation est critique (fuite, panne totale en pleine saison de chauffe), n'hésitez pas à nous joindre directement au {{brand.phone}}.

À très vite,
{{brand.name}}`,
    });
  }

  // Interpolation des variables sur tous les fragments
  for (const s of out) {
    s.subject = interpolate(s.subject, vars);
    s.body = interpolate(s.body, vars);
  }

  // Tri pertinence desc, déduplication par id
  const seen = new Set<string>();
  const deduped = out.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
  deduped.sort((a, b) => b.relevance - a.relevance);

  return deduped.slice(0, 6);
}
