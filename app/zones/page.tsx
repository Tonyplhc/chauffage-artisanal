import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { HeroAside } from "@/components/hero-aside";
import { Building2 } from "lucide-react";
import { COMMUNES } from "@/lib/communes";
import { LuxembourgMap } from "@/components/luxembourg-map";
import { FinalCTA } from "@/components/home/cta";

export const metadata = {
  title: "Zones d'intervention · Chauffage Artisanal Luxembourg",
  description:
    "Nos zones d'intervention au Luxembourg : Luxembourg-Ville, Esch-sur-Alzette, Differdange, Strassen, Bertrange et Grande Région.",
};

export default function ZonesPage() {
  return (
    <>
      <PageHeader
        number="15"
        eyebrow="Zones d'intervention"
        title={
          <>
            Nos zones d&apos;intervention <em className="not-italic text-bleu">au Luxembourg</em>.
          </>
        }
        intro="Tout le Grand-Duché et la Grande Région sur projet. Pages dédiées aux principales communes — choisissez la vôtre pour une lecture adaptée à votre tissu bâti."
        aside={
          <HeroAside
            icon={Building2}
            eyebrow="Couverture"
            items={[
              { label: "Tout le Grand-Duché", body: "Résidentiel, tertiaire, neuf, rénovation" },
              { label: "Grande Région sur projet", body: "Belgique, France, Allemagne" },
              { label: "Pages dédiées", body: "Spécificités tissu bâti par commune" },
            ]}
            footnote="Une visite technique avant chaque devis"
          />
        }
      />

      {/* Carte interactive */}
      <section className="py-10 lg:py-14 bg-creme">
        <div className="container">
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 lg:sticky lg:top-28">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu">
                Visualisation
              </div>
              <h2 className="mt-3 font-display text-display-md text-anthra tracking-tight">
                Nos zones <em className="not-italic text-bleu">en un coup d&apos;œil</em>.
              </h2>
              <p className="mt-5 text-taupe leading-relaxed">
                Survolez un marqueur pour voir le détail de la commune. Pages dédiées
                accessibles d&apos;un clic.
              </p>
              <p className="mt-3 text-sm text-muted">
                Carte schématique · localisations approximatives.
              </p>
            </div>
            <div className="lg:col-span-7">
              <LuxembourgMap communes={COMMUNES} />
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 lg:py-14 bg-creme">
        <div className="container">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu mb-5">
            Toutes les communes documentées
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {COMMUNES.map((c) => (
              <Link
                key={c.slug}
                href={`/zones/${c.slug}`}
                className="group p-6 lg:p-7 rounded-2xl border border-pierre bg-white hover:border-bleu/40 hover:shadow-lift transition-all flex flex-col"
              >
                <div className="flex items-center gap-3">
                  <span className="h-10 w-10 rounded-full bg-bleu/10 border border-bleu/30 grid place-items-center">
                    <MapPin className="h-4 w-4 text-bleu" />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                    Commune
                  </span>
                </div>
                <h2 className="mt-5 font-display text-2xl text-anthra tracking-tight">
                  {c.name}
                </h2>
                <p className="mt-3 text-sm text-taupe leading-relaxed flex-1">
                  {c.context}
                </p>
                <div className="mt-5 pt-5 border-t border-pierre inline-flex items-center gap-2 text-xs font-mono uppercase tracking-eyebrow text-anthra group-hover:text-bleu transition-colors">
                  Voir la page commune
                  <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-muted">
            D&apos;autres communes ?{" "}
            <Link href="/contact" className="text-bleu underline">
              Nous écrire
            </Link>{" "}
            — nous intervenons sur tout le Grand-Duché.
          </p>
        </div>
      </section>

      <FinalCTA />
    </>
  );
}
