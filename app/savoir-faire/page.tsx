"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Lightbulb,
  FileText,
  Wrench,
  ShieldCheck,
  ArrowUpRight,
  Award,
  Clock,
  HandCoins,
  Phone,
  MapPin,
  Sparkles,
} from "lucide-react";
import { PageHeader, Eyebrow, Reveal, SectionTitle, Button } from "@/components/ui";
import { HeroAside } from "@/components/hero-aside";
import { FinalCTA } from "@/components/home/cta";
import { BeforeAfter } from "@/components/before-after";

export default function SavoirFairePage() {
  return (
    <>
      <PageHeader
        number="13"
        eyebrow="Savoir-faire & méthode"
        title={
          <>
            La technique sérieuse,{" "}
            <em className="not-italic text-copper">méthodiquement appliquée</em>.
          </>
        }
        intro={
          <>
            <strong className="text-copper font-semibold">Trois décennies</strong> de chantiers nous ont appris une chose : ce qui distingue une bonne installation d&apos;une mauvaise, ce n&apos;est pas le matériel — c&apos;est la méthode.
          </>
        }
        aside={
          <HeroAside
            icon={Sparkles}
            eyebrow="Notre approche"
            items={[
              { label: "Méthode 5 étapes", body: "Du diagnostic à l'entretien décennal" },
              { label: "Marques européennes", body: "Sélection orientée durabilité pièces" },
              { label: "Indépendance", body: "Recommandations sans exclusivité fabricant" },
            ]}
            footnote="Six métiers · une seule discipline"
          />
        }
      />

      {/* MÉTHODE — 5 ÉTAPES */}
      <section className="py-14 lg:py-20 bg-cream">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <Eyebrow number="01">Méthode d'intervention</Eyebrow>
            <Reveal>
              <SectionTitle className="mt-4">
                Cinq étapes, du premier coup de fil à l'entretien décennal.
              </SectionTitle>
            </Reveal>
            <Reveal delay={1}>
              <p className="mt-6 text-graphite text-lg">
                La même séquence, qu'il s'agisse d'une chaudière domestique à 4 000 € ou d'une
                chaufferie tertiaire à 400 000 €.
              </p>
            </Reveal>
          </div>

          <div className="space-y-4">
            {METHOD.map((m, i) => (
              <MethodStep key={m.title} step={m} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* MARQUES & TECHNOLOGIES */}
      <section className="py-14 lg:py-20 bg-linen border-y border-ink/8">
        <div className="container">
          <div className="grid lg:grid-cols-12 gap-12 mb-10">
            <div className="lg:col-span-7">
              <Eyebrow number="02">Marques & technologies</Eyebrow>
              <Reveal>
                <SectionTitle className="mt-4">
                  Les fabricants que nous installons et entretenons couramment.
                </SectionTitle>
              </Reveal>
              <Reveal delay={1}>
                <p className="mt-6 text-graphite text-lg">
                  Nous intervenons sur les principales marques européennes de chauffage, de
                  climatisation et de pompes à chaleur. Le choix se fait toujours en fonction du
                  projet : performance attendue, contraintes techniques, budget, et disponibilité
                  pièces sur le long terme.
                </p>
              </Reveal>
            </div>
            <div className="lg:col-span-5">
              <div className="p-6 rounded-2xl border border-ink/10 bg-white shadow-soft">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                  <Sparkles className="h-3.5 w-3.5" />
                  Notre approche
                </div>
                <p className="mt-3 text-sm text-graphite leading-relaxed">
                  Nous ne fonctionnons pas en exclusivité de marque. Nous recommandons la solution
                  la mieux adaptée à votre projet, parmi un panel de fabricants éprouvés. Le
                  critère n°1 : pouvoir dépanner et fournir des pièces pendant <strong>15 ans
                  minimum</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {BRANDS.map((b, i) => (
              <Brand key={b.name} brand={b} index={i} />
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-muted max-w-2xl mx-auto">
            Liste indicative de technologies et fabricants couramment rencontrés sur nos chantiers.
            Cette page n'implique aucun partenariat commercial exclusif — nos recommandations
            restent toujours indépendantes du fabricant.
          </p>
        </div>
      </section>

      {/* RÉALISATIONS / INSTALLATIONS MAÎTRISÉES */}
      <section className="py-14 lg:py-20 bg-cream">
        <div className="container">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12 lg:mb-10">
            <div>
              <Eyebrow number="03">Installations maîtrisées</Eyebrow>
              <Reveal>
                <SectionTitle className="mt-5 max-w-3xl">
                  Six métiers, six terrains, une seule discipline.
                </SectionTitle>
              </Reveal>
            </div>
            <Reveal delay={1}>
              <Link
                href="/realisations"
                className="group inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-ink hover:text-copper transition-colors self-start lg:self-end"
              >
                Voir le portfolio complet
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </Reveal>
          </div>

          {/* Showcase grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {SHOWCASE.map((s, i) => (
              <Installation key={s.title} item={s} index={i} />
            ))}
          </div>

          {/* Before / after */}
          <div className="grid lg:grid-cols-12 gap-10 items-center mt-12 pt-10 border-t border-ink/8">
            <div className="lg:col-span-5">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                Avant / après · cas type
              </div>
              <h3 className="mt-4 font-display text-display-md text-balance text-ink">
                Remplacement d&apos;une installation vieillissante par{" "}
                <em className="not-italic text-copper">une solution moderne</em>
              </h3>
              <p className="mt-5 text-graphite">
                Situation type de rénovation : remplacement d&apos;une installation extérieure ancienne par
                une pompe à chaleur récente. Dépose propre, support neuf, lit de galets,
                isolation des liaisons.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-graphite">
                <li className="flex gap-3"><span className="text-copper">→</span> Dépose et évacuation de l&apos;ancien équipement</li>
                <li className="flex gap-3"><span className="text-copper">→</span> Préparation du support et lit de galets</li>
                <li className="flex gap-3"><span className="text-copper">→</span> Mise en service et suivi technique</li>
              </ul>
              <div className="mt-8 flex flex-wrap gap-2">
                {["Luxembourg", "PAC", "Rénovation", "Cas type"].map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-eyebrow bg-white border border-ink/10 text-graphite"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="lg:col-span-7">
              <BeforeAfter
                before="https://images.pexels.com/photos/3964341/pexels-photo-3964341.jpeg?auto=compress&w=1600"
                after="/PAC-air-air1.jpg"
                beforeAlt="Ancienne installation extérieure"
                afterAlt="Nouvelle PAC installée proprement"
                ratio="4/3"
              />
              <p className="mt-3 text-center text-xs text-muted font-mono uppercase tracking-eyebrow">
                Glissez pour comparer · cas illustratif
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* POURQUOI NOUS CHOISIR */}
      <section className="py-14 lg:py-20 bg-linen border-y border-ink/8">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <Eyebrow number="04">Pourquoi nous choisir</Eyebrow>
            <Reveal>
              <SectionTitle className="mt-4">
                Six raisons concrètes, vérifiables, mesurables.
              </SectionTitle>
            </Reveal>
            <Reveal delay={1}>
              <p className="mt-6 text-graphite text-lg">
                Pas de superlatifs, pas de slogans. Voici ce que nos clients peuvent constater
                avant, pendant, et après le chantier.
              </p>
            </Reveal>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-ink/8 border border-ink/8 rounded-2xl overflow-hidden">
            {REASONS.map((r, i) => (
              <Reason key={r.title} reason={r} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* MID-CTA */}
      <section className="py-12 lg:py-14 bg-cream">
        <div className="container">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-8">
              <Eyebrow number="05">Passons à l'action</Eyebrow>
              <h2 className="mt-4 font-display text-display-md text-balance text-ink">
                Décrivez-nous votre projet —{" "}
                <em className="not-italic text-copper">nous appliquons la méthode</em>.
              </h2>
              <p className="mt-4 text-graphite text-lg max-w-2xl">
                Cinq questions, deux minutes. Vous recevez un retour personnalisé sous 4h ouvrées.
              </p>
            </div>
            <div className="lg:col-span-4 flex lg:justify-end gap-3">
              <Button href="/devis" variant="primary">
                Configurer mon projet
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

const METHOD = [
  {
    icon: Search,
    title: "Diagnostic",
    duration: "Selon projet",
    body: "Visite technique, relevés thermiques pièce par pièce, analyse du réseau existant, contraintes du bâtiment. Rapport remis dans des délais raisonnables.",
    details: ["Mesure des déperditions", "Étude du réseau hydraulique", "Photos & schémas existants"],
  },
  {
    icon: Lightbulb,
    title: "Conseil technique",
    duration: "Selon complexité",
    body: "Notre bureau d'études propose des solutions argumentées, avec leurs avantages, leurs limites, et leur coût d'exploitation prévisionnel.",
    details: ["Dimensionnement précis", "Comparatif technologies", "Simulation énergétique"],
  },
  {
    icon: FileText,
    title: "Devis clair",
    duration: "Sous quelques jours",
    body: "Document détaillé poste par poste : équipements, main-d'œuvre, options, informations utiles pour les dossiers d'aides éligibles.",
    details: ["Détail ligne par ligne", "Informations aides", "Conditions de garantie"],
  },
  {
    icon: Wrench,
    title: "Installation",
    duration: "Selon ampleur",
    body: "Équipe dédiée, planning communiqué, protection des sols, nettoyage régulier. Méthode de travail soignée et documentée.",
    details: ["Planning communiqué", "Suivi d'avancement", "Sols protégés, locaux respectés"],
  },
  {
    icon: ShieldCheck,
    title: "Entretien long terme",
    duration: "Engagement durable",
    body: "Mise en service, formation à l'usage, dossier complet remis. Contrats d'entretien et conditions précisées au cas par cas.",
    details: ["Visite annuelle", "Conditions selon contrat", "Priorité aux clients sous contrat"],
  },
];

function MethodStep({ step, index }: { step: (typeof METHOD)[number]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="group grid lg:grid-cols-12 gap-6 lg:gap-10 items-start p-6 lg:p-8 rounded-3xl border border-ink/10 bg-white hover:border-copper/40 hover:shadow-lift transition-all"
    >
      <div className="lg:col-span-1">
        <div className="h-12 w-12 rounded-full bg-copper/10 border border-copper/30 grid place-items-center">
          <step.icon className="h-5 w-5 text-copper" />
        </div>
      </div>
      <div className="lg:col-span-4">
        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
          Étape 0{index + 1}
        </div>
        <h3 className="mt-2 font-display text-2xl text-ink tracking-tight">{step.title}</h3>
        <div className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-eyebrow text-graphite">
          <Clock className="h-3 w-3" />
          {step.duration}
        </div>
      </div>
      <div className="lg:col-span-4">
        <p className="text-graphite leading-relaxed">{step.body}</p>
      </div>
      <div className="lg:col-span-3 grid gap-1.5">
        {step.details.map((d) => (
          <div key={d} className="flex gap-2 items-start text-xs text-graphite">
            <span className="mt-1 h-1 w-1 rounded-full bg-copper shrink-0" />
            {d}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─────────────────────── BRANDS ─────────────────────── */

const BRANDS = [
  { name: "Viessmann", scope: "Chauffage · PAC · solaire", note: "Référence allemande" },
  { name: "Vaillant", scope: "Chauffage · PAC", note: "Gamme européenne large" },
  { name: "Buderus", scope: "Chauffage · biomasse", note: "Fiabilité industrielle" },
  { name: "Daikin", scope: "Climatisation · PAC", note: "Spécialiste japonais" },
  { name: "Mitsubishi Electric", scope: "Climatisation · PAC", note: "Performances reconnues" },
  { name: "Atlantic", scope: "Chauffage · PAC · ECS", note: "Gamme française complète" },
  { name: "Bosch", scope: "Chauffage · connectivité", note: "Solutions connectées" },
  { name: "De Dietrich", scope: "Chauffage · tertiaire", note: "Robustesse industrielle" },
  { name: "Stiebel Eltron", scope: "PAC haute température", note: "Rénovation sans toucher radiateurs" },
  { name: "Hoval", scope: "Biomasse · tertiaire", note: "Solutions premium suisses" },
  { name: "Duravit · Toto", scope: "Sanitaire premium", note: "Céramique haut de gamme" },
  { name: "Hansgrohe · Dornbracht", scope: "Robinetterie design", note: "Finitions premium" },
];

function Brand({ brand, index }: { brand: (typeof BRANDS)[number]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.06 }}
      className="group p-5 rounded-2xl border border-ink/10 bg-white hover:border-copper/40 hover:shadow-lift transition-all"
    >
      <div className="font-display text-2xl tracking-tight text-ink leading-tight">
        {brand.name}
      </div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
        {brand.scope}
      </div>
      <p className="mt-3 text-xs text-graphite leading-relaxed">{brand.note}</p>
    </motion.div>
  );
}

/* ─────────────────────── SHOWCASE INSTALLATIONS ─────────────────────── */

const SHOWCASE = [
  {
    img: "/PAC-air-air1.jpg",
    type: "PAC air/eau",
    techno: "Pompe à chaleur résidentielle",
    place: "Luxembourg",
    title: "Remplacement de chauffage par PAC",
    year: "Cas type",
  },
  {
    img: "/chauffage.jpg",
    type: "Chaudière condensation",
    techno: "Gaz condensation",
    place: "Luxembourg",
    title: "Mise aux normes en rénovation",
    year: "Cas type",
  },
  {
    img: "/reparation-climatisation-2.jpeg",
    type: "Climatisation",
    techno: "Mono-split résidentiel",
    place: "Luxembourg",
    title: "Climatisation maison contemporaine",
    year: "Cas type",
  },
  {
    img: "/sanitaire.jpg",
    type: "Sanitaire",
    techno: "Salle de bain premium",
    place: "Luxembourg",
    title: "Salle de bain master avec architecte",
    year: "Cas type",
  },
  {
    img: "https://images.pexels.com/photos/3760529/pexels-photo-3760529.jpeg?auto=compress&w=1400",
    type: "Entretien",
    techno: "Contrat de maintenance",
    place: "Luxembourg",
    title: "Maintenance chaufferie collective",
    year: "Cas type",
  },
  {
    img: "https://images.pexels.com/photos/433308/pexels-photo-433308.jpeg?auto=compress&w=1400",
    type: "Énergies renouvelables",
    techno: "PV + PAC + stockage",
    place: "Luxembourg",
    title: "Transition énergétique complète",
    year: "Cas type",
  },
];

function Installation({ item, index }: { item: (typeof SHOWCASE)[number]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group rounded-2xl border border-ink/10 bg-white overflow-hidden hover:border-copper/40 hover:shadow-lift transition-all"
    >
      <div className="relative aspect-[4/3] bg-stone overflow-hidden">
        <Image
          src={item.img}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent" />
        <span className="absolute top-3 left-3 font-mono text-[10px] uppercase tracking-eyebrow text-ink bg-cream/90 backdrop-blur-md border border-ink/10 px-3 py-1 rounded-full">
          {item.type}
        </span>
        <span className="absolute top-3 right-3 font-mono text-[10px] uppercase tracking-eyebrow text-copper bg-cream/90 backdrop-blur-md border border-copper/30 px-2.5 py-1 rounded-full">
          {item.year}
        </span>
      </div>
      <div className="p-5">
        <div className="font-display text-xl text-ink tracking-tight">{item.title}</div>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted">
          <MapPin className="h-3 w-3 text-copper" />
          <span>{item.place}</span>
          <span className="text-ink/20">·</span>
          <span className="font-mono uppercase tracking-eyebrow text-[10px] text-graphite truncate">
            {item.techno}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────── REASONS / WHY US ─────────────────────── */

const REASONS = [
  {
    icon: Award,
    title: "Depuis 1994",
    body: "Une activité ancrée dans le temps long, avec continuité de direction. La même maison technique, le même atelier, les mêmes principes.",
    proof: "Expérience depuis 1994",
  },
  {
    icon: HandCoins,
    title: "Accompagnement aides",
    body: "Nous suivons les dispositifs Klimabonus, MyEnergy et aides communales pour préparer le volet technique du dossier. Le dossier administratif reste au nom du client.",
    proof: "Volet technique pris en charge",
  },
  {
    icon: Phone,
    title: "Dépannage organisé",
    body: "Astreinte disponible selon politique en vigueur. Pré-diagnostic au téléphone, organisation rapide d'une intervention selon urgence.",
    proof: "Intervention selon disponibilité",
  },
  {
    icon: ShieldCheck,
    title: "Entretien long terme",
    body: "Contrats d'entretien adaptés à chaque installation. Conditions tarifaires et durée précisées au contrat, sans clause cachée.",
    proof: "Conditions précisées au devis",
  },
  {
    icon: Wrench,
    title: "Expertise multi-métier",
    body: "Chauffage, pompes à chaleur, climatisation, sanitaire, énergies renouvelables : une seule maison technique pour votre confort, un seul interlocuteur.",
    proof: "6 métiers maîtrisés",
  },
  {
    icon: MapPin,
    title: "Zone Luxembourg",
    body: "Intervention sur l'ensemble du Grand-Duché de Luxembourg, et dans la Grande Région sur projet (Belgique, France, Allemagne).",
    proof: "Grand-Duché & Grande Région",
  },
];

function Reason({ reason, index }: { reason: (typeof REASONS)[number]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.08 }}
      className="bg-white p-7 lg:p-8 flex flex-col"
    >
      <div className="h-11 w-11 rounded-full bg-copper/10 border border-copper/30 grid place-items-center">
        <reason.icon className="h-5 w-5 text-copper" />
      </div>
      <div className="mt-5 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
        0{index + 1}
      </div>
      <h3 className="mt-2 font-display text-2xl text-ink tracking-tight">{reason.title}</h3>
      <p className="mt-3 text-sm text-graphite leading-relaxed flex-1">{reason.body}</p>
      <div className="mt-5 pt-5 border-t border-ink/8 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
        ↳ {reason.proof}
      </div>
    </motion.div>
  );
}
