"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Leaf,
  Flame,
  Sun,
  Home,
  Plug,
  Info,
  ArrowUpRight,
  ShieldCheck,
  FileSearch,
  ClipboardList,
  Send,
  HandCoins,
} from "lucide-react";
import { PageHeader, Eyebrow, Reveal, SectionTitle, Button } from "@/components/ui";
import { HeroAside } from "@/components/hero-aside";
import { KlimabonusSimulator } from "@/components/klimabonus-simulator";
import { FinalCTA } from "@/components/home/cta";

export default function PrimesAidesPage() {
  return (
    <>
      <PageHeader
        number="12"
        eyebrow="Primes & aides énergie"
        title={
          <>
            Les aides <em className="not-italic text-copper">au Luxembourg</em>, expliquées
            simplement.
          </>
        }
        intro={
          <>
            Plusieurs dispositifs publics peuvent soutenir vos projets de chauffage, de pompe à chaleur, de solaire et de rénovation énergétique. Les conditions, montants et délais évoluent — <strong className="text-copper font-semibold">nous vérifions systématiquement</strong> avant chaque devis.
          </>
        }
        aside={
          <HeroAside
            icon={HandCoins}
            eyebrow="Dispositifs couverts ici"
            items={[
              { label: "Klimabonus", body: "Programme national d'aides énergie" },
              { label: "Aides communales", body: "Klimapakt — variable selon commune" },
              { label: "TVA réduite", body: "Travaux logement, sous conditions" },
            ]}
            footnote="Sources : MyEnergy · guichet.lu · administration communale"
          />
        }
      />

      {/* INTRO — orientation honnête */}
      <section className="py-8 lg:py-10 bg-cream">
        <div className="container">
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-7">
              <p className="text-lg text-graphite leading-relaxed">
                Au Luxembourg, le soutien financier à la transition énergétique passe principalement
                par le programme national <strong className="text-copper">Klimabonus</strong>, géré par
                l&apos;administration de l&apos;environnement et orienté par l&apos;agence{" "}
                <strong className="text-copper">MyEnergy</strong>. Selon votre commune, des{" "}
                <strong className="text-copper">aides communales</strong> peuvent également
                s&apos;ajouter (Klimapakt). Une <strong className="text-copper">TVA réduite</strong>{" "}
                s&apos;applique aussi à de nombreux travaux dans le logement.
              </p>
              <p className="mt-5 text-lg text-graphite leading-relaxed">
                Chaque projet est différent : type de logement, état initial, technologie installée,
                année de construction. <strong className="text-copper">Nous ne promettons jamais un
                montant fixe</strong> — nous vérifions l&apos;éligibilité réelle de votre dossier en
                amont du chantier.
              </p>
            </div>
            <div className="lg:col-span-5">
              <div className="p-6 rounded-2xl border border-copper/30 bg-copper/5">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Notre engagement
                </div>
                <p className="mt-4 text-sm text-graphite leading-relaxed">
                  Notre devis intègre les informations techniques nécessaires aux dossiers
                  d&apos;aides. Nous orientons vers les organismes officiels{" "}
                  <strong className="text-ink">(MyEnergy, guichet.lu, votre commune)</strong> et
                  préparons les documents qui dépendent de l&apos;installation.
                </p>
                <p className="mt-3 text-sm text-graphite leading-relaxed">
                  La demande administrative reste à votre nom — nous ne facturons jamais de
                  &laquo;&nbsp;commission sur prime&nbsp;&raquo;.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATÉGORIES — 5 cards */}
      <section className="py-14 lg:py-20 bg-linen border-y border-ink/8">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <Eyebrow number="01">Par typologie de projet</Eyebrow>
            <Reveal>
              <SectionTitle className="mt-4">
                Ce qui peut être soutenu, selon votre dossier.
              </SectionTitle>
            </Reveal>
            <Reveal delay={1}>
              <p className="mt-6 text-graphite text-lg">
                Liste indicative non exhaustive. Les conditions exactes, les plafonds et les
                cumuls possibles dépendent du dispositif en vigueur au moment du dépôt.
              </p>
            </Reveal>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORIES.map((c, i) => (
              <Category key={c.title} index={i} {...c} />
            ))}
          </div>
        </div>
      </section>

      {/* ACCOMPAGNEMENT — comment on aide */}
      <section className="py-14 lg:py-20 bg-cream">
        <div className="container">
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 lg:sticky lg:top-28">
              <Eyebrow number="02">On vous accompagne</Eyebrow>
              <Reveal>
                <SectionTitle className="mt-4">
                  Quatre étapes côté technique.
                </SectionTitle>
              </Reveal>
              <Reveal delay={1}>
                <p className="mt-5 text-graphite text-lg">
                  Le dossier administratif reste à votre nom — c&apos;est la règle. Mais tout ce qui
                  relève de l&apos;installation et de la conformité technique est de notre côté, et
                  nous le préparons pour vous.
                </p>
              </Reveal>
              <a
                href="#simulateur"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-3 text-sm font-medium hover:bg-copper transition-colors"
              >
                Vérifier mon projet
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>

            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
              {ACCOMPANY.map((a, i) => (
                <motion.div
                  key={a.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  className="p-6 rounded-2xl border border-ink/10 bg-white hover:border-copper/40 hover:shadow-lift transition-all"
                >
                  <div className="h-10 w-10 rounded-full bg-copper/10 border border-copper/30 grid place-items-center">
                    <a.icon className="h-4 w-4 text-copper" />
                  </div>
                  <div className="mt-4 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                    0{i + 1}
                  </div>
                  <h3 className="mt-2 font-display text-xl text-ink tracking-tight">{a.title}</h3>
                  <p className="mt-2 text-sm text-graphite leading-relaxed">{a.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SIMULATEUR Klimabonus — ancre #simulateur pour les CTAs "Vérifier mon projet" */}
      <div id="simulateur" style={{ scrollMarginTop: "80px" }}>
        <KlimabonusSimulator />
      </div>

      {/* WARNING — disclaimer obligatoire */}
      <section className="py-16 bg-linen border-y border-ink/8">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-6 lg:p-8 rounded-2xl border border-ember/40 bg-ember/8 flex flex-col md:flex-row gap-6 items-start"
          >
            <div className="h-10 w-10 rounded-full bg-ember/15 border border-ember/40 grid place-items-center shrink-0">
              <Info className="h-4 w-4 text-ember" />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-ember">
                Information importante
              </div>
              <p className="mt-3 text-base text-ink leading-relaxed">
                Les montants, plafonds et conditions d&apos;éligibilité des aides énergétiques
                luxembourgeoises <strong>peuvent évoluer</strong>. L&apos;éligibilité dépend du
                projet, du logement, du dispositif en vigueur et des règles édictées par les
                administrations compétentes.
              </p>
              <p className="mt-3 text-sm text-graphite leading-relaxed">
                Cette page est une vue d&apos;ensemble informative. Pour les conditions exactes,
                référez-vous à <strong>MyEnergy</strong>, au site officiel{" "}
                <strong>guichet.lu</strong>, ou à votre <strong>administration communale</strong>.
                Notre bureau d&apos;études vérifie chaque dossier au cas par cas avant
                l&apos;établissement du devis.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* RESSOURCES OFFICIELLES */}
      <section className="py-12 lg:py-14 bg-cream">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <Eyebrow number="03">Sources officielles</Eyebrow>
            <Reveal>
              <SectionTitle className="mt-4">
                Toujours vérifier à la source.
              </SectionTitle>
            </Reveal>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-5 rounded-2xl border border-ink/10 bg-white hover:border-copper/40 hover:shadow-lift transition-all"
              >
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                  Source officielle
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="font-display text-lg text-ink">{l.label}</div>
                  <ArrowUpRight className="h-4 w-4 text-graphite group-hover:text-copper group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="mt-2 text-sm text-graphite leading-relaxed">{l.body}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* MID-CTA */}
      <section className="py-12 lg:py-14 bg-linen border-t border-ink/8">
        <div className="container">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-8">
              <Eyebrow number="04">Étape suivante</Eyebrow>
              <h2 className="mt-4 font-display text-display-md text-balance text-ink">
                Vérifions ensemble ce à quoi{" "}
                <em className="not-italic text-copper">votre projet est éligible</em>.
              </h2>
              <p className="mt-4 text-graphite text-lg max-w-2xl">
                Décrivez-nous votre logement en cinq étapes. Nous revenons vers vous avec une
                évaluation gratuite, claire, et compatible avec les démarches d&apos;aides.
              </p>
            </div>
            <div className="lg:col-span-4 flex lg:justify-end">
              <Button href="/devis" variant="primary">
                Vérifier mon projet
              </Button>
            </div>
          </div>
        </div>
      </section>

      <FinalCTA />
    </>
  );
}

/* ─────────────────────── DATA ─────────────────────── */

const CATEGORIES = [
  {
    icon: Leaf,
    title: "Pompes à chaleur",
    intro:
      "Air/eau, sol/eau, hybride : les PAC figurent parmi les technologies soutenues, sous conditions de performance et d'installation par un professionnel qualifié.",
    points: [
      "Programme Klimabonus en vigueur",
      "Critères de COP minimum selon technologie",
      "Installation par professionnel certifié requise",
    ],
  },
  {
    icon: Flame,
    title: "Chaudière & chauffage",
    intro:
      "Le remplacement d'un chauffage fossile par une solution plus performante (condensation haute, hybride, biomasse) peut entrer dans les dispositifs de soutien.",
    points: [
      "Sortie progressive de l'énergie fossile",
      "Conditions de rendement minimum",
      "Cumul possible avec rénovation enveloppe",
    ],
  },
  {
    icon: Sun,
    title: "Solaire (PV & thermique)",
    intro:
      "Le photovoltaïque et le solaire thermique bénéficient de dispositifs spécifiques, avec des paramètres liés à la puissance, à l'autoconsommation et au type de bâtiment.",
    points: [
      "Photovoltaïque résidentiel & tertiaire",
      "Solaire thermique (ECS, appoint)",
      "Rachat de surplus encadré",
    ],
  },
  {
    icon: Home,
    title: "Rénovation énergétique",
    intro:
      "Isolation, ventilation double flux, fenêtres performantes — les rénovations qui réduisent la consommation énergétique du logement sont couvertes par des dispositifs dédiés.",
    points: [
      "Bonus pour rénovation cohérente",
      "Audit énergétique souvent requis",
      "Cumul possible avec changement de chauffage",
    ],
  },
  {
    icon: Plug,
    title: "Bornes de recharge",
    intro:
      "Les bornes de recharge pour véhicules électriques font l'objet de dispositifs dédiés au Luxembourg, distincts du Klimabonus chauffage.",
    points: [
      "Bornes résidentielles & professionnelles",
      "Conditions techniques d'installation",
      "Dispositif géré séparément",
    ],
  },
  {
    icon: HandCoins,
    title: "Aides communales",
    intro:
      "De nombreuses communes luxembourgeoises (Klimapakt) proposent des aides additionnelles qui peuvent venir compléter les dispositifs nationaux.",
    points: [
      "Variable selon votre commune",
      "Cumul souvent possible avec Klimabonus",
      "À vérifier auprès du service communal",
    ],
  },
];

function Category({
  icon: Icon,
  title,
  intro,
  points,
  index,
}: {
  icon: typeof Leaf;
  title: string;
  intro: string;
  points: string[];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group p-7 lg:p-8 rounded-2xl border border-ink/10 bg-white hover:border-copper/40 hover:shadow-lift transition-all flex flex-col"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="h-11 w-11 rounded-full bg-copper/10 border border-copper/30 grid place-items-center">
          <Icon className="h-5 w-5 text-copper" />
        </div>
        <span className="font-mono text-[9px] uppercase tracking-eyebrow text-muted">
          Aide possible
        </span>
      </div>
      <h3 className="mt-5 font-display text-2xl text-ink tracking-tight">{title}</h3>
      <p className="mt-3 text-sm text-graphite leading-relaxed flex-1">{intro}</p>
      <ul className="mt-5 space-y-2 pt-5 border-t border-ink/8">
        {points.map((p) => (
          <li key={p} className="flex gap-2 items-start text-xs text-graphite">
            <span className="mt-1.5 h-1 w-1 rounded-full bg-copper shrink-0" />
            {p}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

const ACCOMPANY = [
  {
    icon: FileSearch,
    title: "Vérification d'éligibilité",
    body: "Avant le devis, nous regardons si votre projet entre dans les critères en vigueur des dispositifs nationaux et communaux.",
  },
  {
    icon: ClipboardList,
    title: "Préparation technique",
    body: "Schémas, fiches produits, attestations de pose, certificats de combustion : nous fournissons tout ce qui dépend de l'installation.",
  },
  {
    icon: Send,
    title: "Orientation démarches",
    body: "Nous vous indiquons quel formulaire viser, où le déposer, et quels justificatifs administratifs préparer de votre côté.",
  },
  {
    icon: ShieldCheck,
    title: "Devis compatible",
    body: "Notre devis est rédigé de façon à pouvoir être joint à votre dossier d'aide, avec les libellés et les détails attendus.",
  },
];

const LINKS = [
  {
    label: "MyEnergy",
    href: "https://www.myenergy.lu",
    body: "Agence luxembourgeoise officielle de conseil énergétique aux particuliers et collectivités.",
  },
  {
    label: "Klimabonus",
    href: "https://klimabonus.lu",
    body: "Portail du programme national d'aides à la rénovation énergétique et aux énergies renouvelables.",
  },
  {
    label: "Guichet.lu",
    href: "https://guichet.public.lu",
    body: "Portail administratif du Grand-Duché : démarches, formulaires et conditions actualisées.",
  },
];
