"use client";

/**
 * Vérificateur d'éligibilité Klimabonus interactif.
 *
 * Page publique pour aider les prospects à comprendre rapidement leur
 * éligibilité estimative et le montant approximatif de l'aide.
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  Info,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import {
  checkKlimabonusEligibility,
  PROJECT_LABELS,
  type ProjectType,
  type BuildingAge,
  type HousingType,
  type OwnerType,
  type IncomeBracket,
} from "@/lib/klimabonus-checker";
import { formatEur } from "@/lib/formatters";

export default function KlimabonusCheckerPage() {
  const [projectType, setProjectType] = useState<ProjectType>("pac-air-eau");
  const [buildingAge, setBuildingAge] = useState<BuildingAge>("plus-30ans");
  const [housingType, setHousingType] = useState<HousingType>("individuelle");
  const [ownerType, setOwnerType] = useState<OwnerType>("proprietaire-occupant");
  const [incomeBracket, setIncomeBracket] = useState<IncomeBracket>("standard");
  const [totalCost, setTotalCost] = useState(20000);

  const result = useMemo(
    () =>
      checkKlimabonusEligibility({
        projectType,
        buildingAge,
        housingType,
        ownerType,
        incomeBracket,
        totalCostEur: totalCost,
      }),
    [projectType, buildingAge, housingType, ownerType, incomeBracket, totalCost],
  );

  return (
    <div className="min-h-screen bg-cream py-12 lg:py-16">
      <div className="container max-w-5xl">
        <div className="mb-8">
          <Link
            href="/"
            className="text-xs font-mono uppercase tracking-eyebrow text-graphite hover:text-copper"
          >
            ← Retour accueil
          </Link>
          <h1 className="mt-4 font-display text-display-md text-ink">
            Éligibilité Klimabonus
          </h1>
          <p className="mt-2 text-graphite max-w-2xl">
            Estimation rapide de votre éligibilité à l&apos;aide Klimabonus
            Luxembourg et du montant approximatif. Pour confirmation et dépôt
            officiel, consultez{" "}
            <a
              href="https://klimabonus.lu"
              target="_blank"
              rel="noreferrer"
              className="text-copper underline"
            >
              klimabonus.lu
            </a>
            .
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
                Votre projet
              </div>

              <Field label="Type de travaux">
                <select
                  value={projectType}
                  onChange={(e) =>
                    setProjectType(e.target.value as ProjectType)
                  }
                  className="w-full bg-cream border border-ink/12 rounded-lg px-3 py-2 text-sm focus:border-copper focus:outline-none"
                >
                  {Object.entries(PROJECT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={`Coût total TTC : ${formatEur(totalCost)}`}>
                <input
                  type="range"
                  min="3000"
                  max="80000"
                  step="500"
                  value={totalCost}
                  onChange={(e) => setTotalCost(Number(e.target.value))}
                  className="w-full accent-copper"
                />
              </Field>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
                Votre logement
              </div>

              <Field label="Âge du bâtiment">
                <ChipGroup
                  value={buildingAge}
                  onChange={(v) => setBuildingAge(v as BuildingAge)}
                  options={[
                    { value: "neuf", label: "Neuf (<5 ans)" },
                    { value: "moins-10ans", label: "<10 ans" },
                    { value: "10-30ans", label: "10-30 ans" },
                    { value: "plus-30ans", label: ">30 ans" },
                  ]}
                />
              </Field>

              <Field label="Type de logement">
                <ChipGroup
                  value={housingType}
                  onChange={(v) => setHousingType(v as HousingType)}
                  options={[
                    { value: "individuelle", label: "Maison" },
                    { value: "appartement", label: "Appartement" },
                    { value: "collectif", label: "Collectif" },
                  ]}
                />
              </Field>

              <Field label="Statut">
                <ChipGroup
                  value={ownerType}
                  onChange={(v) => setOwnerType(v as OwnerType)}
                  options={[
                    { value: "proprietaire-occupant", label: "Propriétaire occupant" },
                    { value: "proprietaire-bailleur", label: "Bailleur" },
                    { value: "syndicat", label: "Syndicat" },
                  ]}
                />
              </Field>

              <Field label="Tranche de revenus">
                <ChipGroup
                  value={incomeBracket}
                  onChange={(v) => setIncomeBracket(v as IncomeBracket)}
                  options={[
                    { value: "standard", label: "Standard" },
                    { value: "modeste", label: "Modeste" },
                    { value: "tres-modeste", label: "Très modeste" },
                  ]}
                />
              </Field>
            </div>
          </div>

          {/* Result */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
                Estimation
              </div>

              {result.eligibility === "non-eligible" ? (
                <div className="text-center py-6">
                  <AlertTriangle className="h-10 w-10 text-ember mx-auto mb-3" />
                  <div className="font-display text-lg text-ink">
                    Non éligible
                  </div>
                  <p className="text-sm text-graphite mt-2">
                    Le projet, dans cette configuration, ne semble pas
                    correspondre aux critères Klimabonus. Voir détails ci-dessous.
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-center py-3">
                    <div
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-full mb-3 ${
                        result.eligibility === "eligible"
                          ? "bg-[#22a06b]/10 text-[#22a06b]"
                          : "bg-copper/10 text-copper"
                      }`}
                    >
                      {result.eligibility === "eligible" ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <ShieldCheck className="h-5 w-5" />
                      )}
                    </div>
                    <div className="font-display text-2xl text-ink">
                      {result.estimatedAidEur && (
                        <>
                          {formatEur(result.estimatedAidEur[0], true)} –{" "}
                          {formatEur(result.estimatedAidEur[1], true)}
                        </>
                      )}
                    </div>
                    {result.percentRange && (
                      <div className="text-sm text-graphite mt-1">
                        soit ~{result.percentRange[0]} – {result.percentRange[1]} % du coût
                      </div>
                    )}
                    <div
                      className={`mt-3 inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-eyebrow px-3 py-1 rounded-full ${
                        result.eligibility === "eligible"
                          ? "bg-[#22a06b]/10 text-[#22a06b]"
                          : "bg-copper/10 text-copper"
                      }`}
                    >
                      {result.eligibility === "eligible"
                        ? "Probablement éligible"
                        : "Éligibilité probable"}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
                Critères évalués
              </div>
              <ul className="space-y-1.5 text-sm">
                {result.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span
                      className={`mt-1 inline-block h-1.5 w-1.5 rounded-full shrink-0 ${
                        r.type === "positive"
                          ? "bg-[#22a06b]"
                          : r.type === "warning"
                            ? "bg-copper"
                            : "bg-ember"
                      }`}
                    />
                    <span
                      className={
                        r.type === "negative" ? "text-ember" : "text-graphite"
                      }
                    >
                      {r.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {result.tips.length > 0 && (
              <div className="rounded-2xl border border-copper/30 bg-copper/5 p-5">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2 inline-flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Conseils
                </div>
                <ul className="space-y-1.5 text-sm text-graphite">
                  {result.tips.map((t, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-copper mt-1.5 inline-block h-1 w-1 rounded-full bg-copper shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-2xl border border-ink/10 bg-ink/5 p-5 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-display text-base text-ink">
                  Prêt à concrétiser ?
                </div>
                <p className="text-sm text-graphite mt-1">
                  Nous montons votre dossier Klimabonus avec vous.
                </p>
              </div>
              <Link
                href="/devis"
                className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper transition-colors"
              >
                Demander un devis
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-copper/30 bg-copper/5 p-5 text-xs text-graphite">
          <Info className="h-4 w-4 text-copper mb-2" />
          <p>
            <strong>Avertissement</strong> — Les montants et taux d&apos;aide
            sont revus par règlement grand-ducal. Cette estimation utilise des
            grilles indicatives et ne se substitue PAS à un dépôt officiel.
            Le dossier doit être déposé AVANT démarrage des travaux. Toujours
            confirmer sur{" "}
            <a
              href="https://klimabonus.lu"
              target="_blank"
              rel="noreferrer"
              className="text-copper underline"
            >
              klimabonus.lu
            </a>{" "}
            ou auprès d&apos;un conseiller habilité.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <div className="text-xs text-graphite mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function ChipGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
            value === o.value
              ? "bg-ink text-cream border-ink"
              : "bg-cream border-ink/12 text-graphite hover:border-copper/40"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
