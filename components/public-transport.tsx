/**
 * <PublicTransport /> — bloc transport public Peppange.
 *
 * Données vérifiées via mobiliteit.lu / RGTR :
 *   - 3 arrêts de bus à Peppange (Kirchwois, Duerfplaz, Musée)
 *   - 4 lignes desservant la localité (511, E12, N03, Flexibus)
 *   - Gare CFL la plus proche : Berchem ~1 km
 *   - Gratuité depuis le 29 février 2020
 *
 * Sources : mobiliteit.lu, roeser.lu, gouvernement.lu (bilan 5 ans gratuité)
 */

import { Bus, Train, MapPin, ExternalLink } from "lucide-react";
import { Eyebrow } from "@/components/ui";

const STOPS = [
  {
    name: "Peppange-Kirchwois",
    detail: "rue de Crauthem · ~300 m de l'atelier",
    lines: ["511", "N03"],
  },
  {
    name: "Peppange-Duerfplaz",
    detail: "place du village",
    lines: ["511", "E12"],
  },
  {
    name: "Peppange-Musée",
    detail: "près du Musée Rural et Artisanal",
    lines: ["N03", "511"],
  },
];

const LINES = [
  {
    code: "511",
    label: "Luxembourg-Gare ↔ Roeser ↔ Bettembourg",
    type: "Ligne régulière (~20 min vers Lux-Ville)",
  },
  {
    code: "E12",
    label: "Limpertsberg ↔ Fentange ↔ Berchem/Livange",
    type: "Express scolaire (LTC, LRSL, LML, LGL, LAM1)",
  },
  {
    code: "N03",
    label: "Peppange ↔ Val de Roeser ↔ Dudelange",
    type: "Late Night Bus (week-end nocturne)",
  },
  {
    code: "Flexibus",
    label: "Transport à la demande commune Roeser",
    type: "Gratuit · 8002 20 20 · lun-ven 7h30-19h",
  },
];

export function PublicTransport() {
  return (
    <section className="py-14 bg-creme border-y border-pierre">
      <div className="container max-w-4xl">
        <div className="mb-8">
          <Eyebrow number="🚌">Accès en transport public</Eyebrow>
          <h2 className="mt-3 font-display text-2xl lg:text-3xl text-anthra tracking-tight">
            Peppange est <em className="not-italic text-bleu">gratuitement</em> accessible
            depuis Luxembourg-Ville.
          </h2>
          <p className="mt-3 text-sm text-taupe leading-relaxed">
            Le transport public est gratuit au Luxembourg depuis le{" "}
            <a
              href="https://gouvernement.lu/fr/actualites/toutes_actualites/communiques/2025/02-fevrier/28-bilan-transport-gratuit.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-bleu hover:underline"
            >
              29 février 2020
            </a>{" "}
            — bus, train (2nde classe), tram. Tous les arrêts ci-dessous sont à pied de
            l&apos;atelier.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Arrêts de bus */}
          <div className="rounded-2xl border border-pierre bg-white p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bus className="h-5 w-5 text-bleu" />
              <h3 className="font-display text-lg text-anthra tracking-tight">
                Arrêts à Peppange
              </h3>
            </div>
            <ul className="space-y-3">
              {STOPS.map((s) => (
                <li
                  key={s.name}
                  className="pb-3 border-b border-pierre last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-bleu mt-1 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-anthra">{s.name}</div>
                      <div className="text-xs text-taupe">{s.detail}</div>
                      <div className="mt-1.5 flex gap-1 flex-wrap">
                        {s.lines.map((l) => (
                          <span
                            key={l}
                            className="text-[10px] font-mono uppercase tracking-eyebrow bg-bleu/10 border border-bleu/30 text-bleu px-1.5 py-0.5 rounded-full"
                          >
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Lignes */}
          <div className="rounded-2xl border border-pierre bg-white p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bus className="h-5 w-5 text-bleu" />
              <h3 className="font-display text-lg text-anthra tracking-tight">
                Lignes desservant
              </h3>
            </div>
            <ul className="space-y-3">
              {LINES.map((l) => (
                <li
                  key={l.code}
                  className="pb-3 border-b border-pierre last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs font-bold bg-navy text-creme px-2 py-1 rounded shrink-0 min-w-[40px] text-center">
                      {l.code}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-anthra">{l.label}</div>
                      <div className="text-xs text-taupe">{l.type}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Train CFL */}
        <div className="mt-6 p-5 rounded-2xl border border-bleu/30 bg-white">
          <div className="flex items-start gap-3">
            <Train className="h-5 w-5 text-bleu mt-0.5 shrink-0" />
            <div>
              <div className="font-display text-base text-anthra">
                Gare CFL la plus proche : Berchem
              </div>
              <p className="mt-1 text-sm text-taupe">
                ~1 km de l&apos;atelier (14 min à pied). Liaison directe vers
                Luxembourg-Gare centrale en ~10-13 min, fréquence soutenue.
              </p>
              <a
                href="https://www.cfl.lu/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-bleu hover:underline"
              >
                Horaires CFL <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-5 text-[11px] text-muted leading-relaxed">
          Sources :{" "}
          <a
            href="https://www.mobiliteit.lu/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-bleu"
          >
            mobiliteit.lu
          </a>{" "}
          ·{" "}
          <a
            href="https://www.roeser.lu/p/208/2"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-bleu"
          >
            commune de Roeser
          </a>
          . Horaires précis et fréquences à confirmer via le PDF officiel ligne 511 sur
          mobiliteit.lu ou la Mobilitéitszentral (2465 2465).
        </div>
      </div>
    </section>
  );
}
