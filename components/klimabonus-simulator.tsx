"use client";

/**
 * Simulateur d'éligibilité Klimabonus — outil d'orientation, pas de calculateur
 * de montant.
 *
 * Posture éditoriale stricte (cf. content-truth-audit.md) :
 *   - Aucun montant chiffré (les barèmes Klimabonus évoluent).
 *   - Réponses qualitatives : « probablement éligible », « partiellement »,
 *     « à vérifier auprès des sources officielles ».
 *   - On nomme les dispositifs probables (Klimabonus chauffage / rénovation /
 *     solaire / borne) et on renvoie systématiquement vers MyEnergy + guichet.lu.
 *
 * L'objectif business : qualifier un projet → CTA /devis avec contexte préfilé.
 */

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
  RotateCcw,
  ArrowUpRight,
} from "lucide-react";
import { Eyebrow, Reveal, SectionTitle } from "@/components/ui";

type Answer = {
  projectType?: "pac" | "chaudiere" | "solaire" | "renovation" | "borne" | "autre";
  buildingAge?: "before_1995" | "1995_2007" | "after_2007" | "neuf" | "unknown";
  isMainResidence?: "yes" | "no" | "unknown";
  hasPro?: "yes" | "maybe" | "no";
};

type Step = 0 | 1 | 2 | 3 | 4; // 0..3 questions, 4 résultat

const PROJECT_LABELS: Record<NonNullable<Answer["projectType"]>, string> = {
  pac: "Pompe à chaleur",
  chaudiere: "Chaudière (condensation / biomasse)",
  solaire: "Solaire (PV ou thermique)",
  renovation: "Rénovation énergétique (isolation, fenêtres, ventilation)",
  borne: "Borne de recharge VE",
  autre: "Autre projet",
};

// Mappe le projet déclaré vers un service du configurateur /devis.
const KLIMA_SERVICE_MAP: Record<string, string> = {
  pac: "pac",
  chaudiere: "chauffage",
  solaire: "enr",
  renovation: "autre",
  borne: "autre",
  autre: "autre",
};

const BUILDING_LABELS: Record<NonNullable<Answer["buildingAge"]>, string> = {
  before_1995: "Avant 1995",
  "1995_2007": "Entre 1995 et 2007",
  after_2007: "Après 2007",
  neuf: "Neuf / en construction",
  unknown: "Je ne sais pas",
};

export function KlimabonusSimulator() {
  const [step, setStep] = useState<Step>(0);
  const [a, setA] = useState<Answer>({});

  const next = () => setStep((s) => Math.min(4, s + 1) as Step);
  const back = () => setStep((s) => Math.max(0, s - 1) as Step);
  const reset = () => {
    setA({});
    setStep(0);
  };

  const canNext =
    (step === 0 && a.projectType) ||
    (step === 1 && a.buildingAge) ||
    (step === 2 && a.isMainResidence) ||
    (step === 3 && a.hasPro);

  return (
    <section className="py-14 lg:py-20 bg-cream border-y border-ink/8">
      <div className="container max-w-4xl">
        <div className="text-center mb-10 lg:mb-14">
          <Eyebrow number="05">Simulateur d&apos;éligibilité</Eyebrow>
          <Reveal>
            <SectionTitle className="mt-4">
              Vérifiez en 2 minutes si votre projet peut être{" "}
              <em className="not-italic text-copper">aidé par l&apos;État</em>.
            </SectionTitle>
          </Reveal>
          <Reveal delay={1}>
            <p className="mt-5 text-graphite text-lg max-w-2xl mx-auto">
              Outil d&apos;orientation indicative. Ne remplace pas la vérification
              auprès de MyEnergy et de votre commune.
            </p>
          </Reveal>
        </div>

        <div className="rounded-3xl border border-ink/10 bg-white shadow-soft overflow-hidden">
          {/* Progress bar */}
          <div className="h-1.5 bg-ink/5 relative">
            <motion.div
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.4 }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-copper to-ember"
            />
          </div>

          <div className="p-6 lg:p-10 min-h-[320px]">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <Question
                  key="q0"
                  index={1}
                  total={4}
                  title="Quel est votre projet principal ?"
                  hint="Choisissez le type d'installation envisagée. S'il y en a plusieurs, prenez le plus structurant."
                  options={Object.entries(PROJECT_LABELS).map(([id, label]) => ({
                    id,
                    label,
                  }))}
                  selected={a.projectType}
                  onSelect={(id) =>
                    setA({ ...a, projectType: id as NonNullable<Answer["projectType"]> })
                  }
                />
              )}
              {step === 1 && (
                <Question
                  key="q1"
                  index={2}
                  total={4}
                  title="De quelle époque est votre bâtiment ?"
                  hint="L'année de construction conditionne souvent l'éligibilité (PEB initial)."
                  options={Object.entries(BUILDING_LABELS).map(([id, label]) => ({
                    id,
                    label,
                  }))}
                  selected={a.buildingAge}
                  onSelect={(id) =>
                    setA({ ...a, buildingAge: id as NonNullable<Answer["buildingAge"]> })
                  }
                />
              )}
              {step === 2 && (
                <Question
                  key="q2"
                  index={3}
                  total={4}
                  title="Le logement est-il votre résidence principale ?"
                  hint="Certains dispositifs sont réservés aux résidences principales."
                  options={[
                    { id: "yes", label: "Oui, résidence principale" },
                    { id: "no", label: "Non, secondaire ou locatif" },
                    { id: "unknown", label: "C'est un projet professionnel / tertiaire" },
                  ]}
                  selected={a.isMainResidence}
                  onSelect={(id) =>
                    setA({ ...a, isMainResidence: id as NonNullable<Answer["isMainResidence"]> })
                  }
                />
              )}
              {step === 3 && (
                <Question
                  key="q3"
                  index={4}
                  total={4}
                  title="L'installation sera-t-elle réalisée par un professionnel qualifié ?"
                  hint="Les dispositifs publics imposent quasi systématiquement un installateur déclaré."
                  options={[
                    { id: "yes", label: "Oui, par une entreprise qualifiée" },
                    { id: "maybe", label: "Je ne sais pas encore" },
                    { id: "no", label: "Non, auto-installation prévue" },
                  ]}
                  selected={a.hasPro}
                  onSelect={(id) =>
                    setA({ ...a, hasPro: id as NonNullable<Answer["hasPro"]> })
                  }
                />
              )}
              {step === 4 && <Result key="result" a={a} />}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="px-6 lg:px-10 py-5 border-t border-ink/8 bg-linen/40 flex items-center justify-between">
            <button
              onClick={step === 4 ? reset : back}
              disabled={step === 0}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                step === 0
                  ? "text-muted cursor-not-allowed"
                  : "text-graphite hover:text-ink"
              }`}
            >
              {step === 4 ? (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Recommencer
                </>
              ) : (
                <>
                  <ArrowLeft className="h-4 w-4" />
                  Précédent
                </>
              )}
            </button>
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
              {step < 4 ? `Question ${step + 1} sur 4` : "Résultat indicatif"}
            </div>
            {step < 4 && (
              <button
                onClick={next}
                disabled={!canNext}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  canNext
                    ? "bg-ink text-cream hover:bg-copper"
                    : "bg-ink/15 text-ink/40 cursor-not-allowed"
                }`}
              >
                {step === 3 ? "Voir le résultat" : "Suivant"}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Question ─────────────── */

function Question({
  index,
  total,
  title,
  hint,
  options,
  selected,
  onSelect,
}: {
  index: number;
  total: number;
  title: string;
  hint: string;
  options: { id: string; label: string }[];
  selected: string | undefined;
  onSelect: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.3 }}
    >
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
        Étape {index} / {total}
      </div>
      <h3 className="mt-3 font-display text-2xl lg:text-3xl text-ink tracking-tight">
        {title}
      </h3>
      <p className="mt-3 text-sm text-graphite">{hint}</p>

      <div className="mt-7 grid sm:grid-cols-2 gap-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className={`text-left px-5 py-4 rounded-2xl border transition-all ${
              selected === opt.id
                ? "border-copper bg-copper/8 ring-2 ring-copper/20"
                : "border-ink/12 bg-white hover:border-copper/40 hover:shadow-soft"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-ink font-medium text-base">{opt.label}</span>
              {selected === opt.id && (
                <CheckCircle2 className="h-5 w-5 text-copper shrink-0" />
              )}
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

/* ─────────────── Result ─────────────── */

type Verdict = {
  level: "likely" | "partial" | "unlikely";
  headline: string;
  schemes: { label: string; body: string }[];
  warnings: string[];
};

function buildVerdict(a: Answer): Verdict {
  const blocked = a.hasPro === "no";
  const projectKnown = !!a.projectType;
  const warnings: string[] = [];

  if (blocked) {
    warnings.push(
      "Sans installateur qualifié déclaré, les dispositifs publics ne s'appliquent quasi jamais.",
    );
  }
  if (a.isMainResidence === "no") {
    warnings.push(
      "Pour une résidence secondaire ou locative, certaines aides sont restreintes ou exclues.",
    );
  }
  if (a.isMainResidence === "unknown") {
    warnings.push(
      "Pour un projet tertiaire / professionnel, les dispositifs nationaux diffèrent des aides résidentielles.",
    );
  }
  if (a.buildingAge === "unknown") {
    warnings.push(
      "L'année de construction influence souvent le barème — à confirmer avec le notaire ou les archives communales.",
    );
  }

  const schemes: { label: string; body: string }[] = [];

  // Suggestions de dispositifs selon le type de projet
  if (a.projectType === "pac") {
    schemes.push({
      label: "Klimabonus — chauffage / pompe à chaleur",
      body: "Air/eau, sol/eau et hybrides éligibles sous conditions de COP et d'installation par un professionnel qualifié.",
    });
    if (a.buildingAge === "before_1995") {
      schemes.push({
        label: "Bonus rénovation cohérente (audit énergétique souvent requis)",
        body: "Un projet PAC dans un bâtiment ancien peut s'accompagner d'un audit énergétique pour optimiser le dossier.",
      });
    }
  } else if (a.projectType === "chaudiere") {
    schemes.push({
      label: "Klimabonus — chauffage performant",
      body: "Le remplacement d'un chauffage fossile par une solution plus performante peut entrer dans les dispositifs de soutien.",
    });
  } else if (a.projectType === "solaire") {
    schemes.push({
      label: "Klimabonus — solaire photovoltaïque ou thermique",
      body: "Dispositifs spécifiques avec paramètres liés à la puissance, à l'autoconsommation et au type de bâtiment.",
    });
  } else if (a.projectType === "renovation") {
    schemes.push({
      label: "Klimabonus — rénovation énergétique",
      body: "Isolation, ventilation double flux, fenêtres performantes. Audit énergétique souvent requis pour optimiser.",
    });
  } else if (a.projectType === "borne") {
    schemes.push({
      label: "Aide bornes de recharge VE",
      body: "Dispositif géré séparément du Klimabonus chauffage, avec conditions techniques d'installation propres.",
    });
  } else if (a.projectType === "autre") {
    schemes.push({
      label: "Vérification au cas par cas",
      body: "Tous les projets ne sont pas éligibles aux dispositifs nationaux. Une vérification ciblée sur MyEnergy est nécessaire.",
    });
  }

  // Aides communales — quasi toujours mentionnables
  if (a.isMainResidence === "yes") {
    schemes.push({
      label: "Aides communales (Klimapakt)",
      body: "De nombreuses communes proposent des aides additionnelles cumulables avec les dispositifs nationaux. À vérifier auprès de votre service communal.",
    });
    schemes.push({
      label: "TVA réduite sur travaux logement",
      body: "Sous conditions d'ancienneté et d'usage du logement.",
    });
  }

  // Verdict global
  let level: Verdict["level"];
  let headline: string;

  if (blocked || a.projectType === "autre" || a.buildingAge === "unknown") {
    level = "unlikely";
    headline =
      "Votre projet nécessite une vérification ciblée — l'éligibilité n'est pas évidente en l'état des informations.";
  } else if (warnings.length >= 2) {
    level = "partial";
    headline =
      "Votre projet présente plusieurs limites — certains dispositifs peuvent toutefois s'appliquer.";
  } else if (projectKnown && a.hasPro === "yes" && a.isMainResidence === "yes") {
    level = "likely";
    headline =
      "Votre projet a de bonnes chances d'être éligible à plusieurs dispositifs publics.";
  } else {
    level = "partial";
    headline =
      "Votre projet est potentiellement éligible — quelques points à clarifier pour confirmer.";
  }

  return { level, headline, schemes, warnings };
}

function Result({ a }: { a: Answer }) {
  const v = buildVerdict(a);
  const accent =
    v.level === "likely"
      ? { color: "#22a06b", bg: "rgba(34,160,107,0.08)", border: "rgba(34,160,107,0.4)" }
      : v.level === "partial"
      ? { color: "#b86a36", bg: "rgba(184,106,54,0.08)", border: "rgba(184,106,54,0.4)" }
      : { color: "#dc5a28", bg: "rgba(220,90,40,0.08)", border: "rgba(220,90,40,0.4)" };

  const projectLabel = a.projectType ? PROJECT_LABELS[a.projectType] : "Projet";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Verdict header */}
      <div
        className="p-6 rounded-2xl border"
        style={{ background: accent.bg, borderColor: accent.border }}
      >
        <div className="flex items-start gap-4">
          <span
            className="h-11 w-11 rounded-full grid place-items-center border shrink-0"
            style={{ background: `${accent.color}22`, borderColor: accent.border, color: accent.color }}
          >
            {v.level === "likely" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : v.level === "partial" ? (
              <Info className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
          </span>
          <div className="min-w-0">
            <div
              className="font-mono text-[10px] uppercase tracking-eyebrow"
              style={{ color: accent.color }}
            >
              Résultat indicatif · {projectLabel}
            </div>
            <p className="mt-2 text-base lg:text-lg text-ink leading-snug">
              {v.headline}
            </p>
          </div>
        </div>
      </div>

      {/* Dispositifs probables */}
      {v.schemes.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            Dispositifs à explorer
          </div>
          <ul className="grid gap-2.5">
            {v.schemes.map((s) => (
              <li
                key={s.label}
                className="px-4 py-3 rounded-xl bg-cream border border-ink/8"
              >
                <div className="text-sm font-medium text-ink">{s.label}</div>
                <div className="mt-1 text-xs text-graphite leading-relaxed">{s.body}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Avertissements */}
      {v.warnings.length > 0 && (
        <div className="mt-6">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-3">
            Points à clarifier
          </div>
          <ul className="grid gap-2">
            {v.warnings.map((w) => (
              <li
                key={w}
                className="px-4 py-2.5 rounded-xl bg-ember/5 border border-ember/30 text-xs text-graphite"
              >
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sources officielles + CTAs */}
      <div className="mt-7 pt-6 border-t border-ink/8">
        <p className="text-xs text-muted mb-4">
          Outil d&apos;orientation uniquement. Les conditions exactes, plafonds et
          cumuls dépendent du dispositif en vigueur au moment du dépôt — vérifiez
          systématiquement à la source :{" "}
          <a
            href="https://www.myenergy.lu"
            target="_blank"
            rel="noopener noreferrer"
            className="text-copper underline"
          >
            MyEnergy
          </a>
          ,{" "}
          <a
            href="https://klimabonus.lu"
            target="_blank"
            rel="noopener noreferrer"
            className="text-copper underline"
          >
            Klimabonus.lu
          </a>
          ,{" "}
          <a
            href="https://guichet.public.lu"
            target="_blank"
            rel="noopener noreferrer"
            className="text-copper underline"
          >
            guichet.lu
          </a>
          .
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/devis?from=klimabonus-simulator&service=${KLIMA_SERVICE_MAP[a.projectType ?? "autre"] ?? "autre"}`}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-ink text-cream px-6 py-3.5 text-sm font-medium hover:bg-copper transition-colors"
          >
            Demander un devis personnalisé
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-6 py-3.5 text-sm font-medium text-ink hover:border-copper hover:text-copper transition-colors"
          >
            Parler à un conseiller
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
