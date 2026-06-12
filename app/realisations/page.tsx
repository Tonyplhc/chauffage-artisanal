"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useMemo } from "react";
import { ArrowUpRight, MapPin, Cpu, Info, FolderOpen } from "lucide-react";
import { PageHeader, Eyebrow, Reveal } from "@/components/ui";
import { HeroAside } from "@/components/hero-aside";
import { FinalCTA } from "@/components/home/cta";
import { BeforeAfter } from "@/components/before-after";
import { cn } from "@/lib/utils";

type Project = {
  img: string;
  type: string;
  place: string;
  title: string;
  body: string;
  techno: string;
  category:
    | "chauffage"
    | "pac"
    | "clim"
    | "sanitaire"
    | "entretien"
    | "enr";
  tags: string[];
};

const PROJECTS: Project[] = [
  {
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop",
    type: "Villa privée",
    place: "Luxembourg",
    title: "Système hybride solaire + pompe à chaleur",
    body: "Remplacement d'une ancienne chaudière fioul par un système combinant capteurs solaires thermiques et pompe à chaleur géothermique avec ballon tampon.",
    techno: "PAC sol/eau · solaire thermique",
    category: "pac",
    tags: ["Rénovation lourde", "Hybride", "Géothermie"],
  },
  {
    img: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop",
    type: "Bureau tertiaire",
    place: "Luxembourg",
    title: "Climatisation centralisée tertiaire",
    body: "Système multi-zones avec récupération d'énergie pour un bâtiment tertiaire. Pilotage centralisé, GTC selon configuration.",
    techno: "VRV · récupération d'énergie",
    category: "clim",
    tags: ["Tertiaire", "GTC", "Multi-zones"],
  },
  {
    img: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=1600&auto=format&fit=crop",
    type: "Maison passive",
    place: "Luxembourg",
    title: "PAC air/eau + ventilation double flux",
    body: "Construction neuve à très basse consommation. Pompe à chaleur air/eau, ventilation double flux, plancher chauffant basse température.",
    techno: "PAC air/eau · VMC DF",
    category: "pac",
    tags: ["Neuf", "Maison passive", "Double flux"],
  },
  {
    img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=1600&auto=format&fit=crop",
    type: "Résidentiel collectif",
    place: "Luxembourg",
    title: "Chaufferie collective à condensation",
    body: "Remplacement de la chaufferie d'un immeuble. Cascade de chaudières gaz à condensation, désembouage du circuit, équilibrage hydraulique.",
    techno: "Cascade gaz condensation",
    category: "chauffage",
    tags: ["Collectif", "Cascade", "Rénovation"],
  },
  {
    img: "https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&w=1600",
    type: "Restaurant",
    place: "Luxembourg",
    title: "Climatisation & ventilation cuisine professionnelle",
    body: "Climatisation salle, extraction hotte avec arrivée d'air compensée, intégration architecturale soignée pour respecter l'acoustique en salle.",
    techno: "Clim + ventilation pro",
    category: "clim",
    tags: ["Hôtellerie", "Acoustique", "Architecte"],
  },
  {
    img: "https://images.pexels.com/photos/3935352/pexels-photo-3935352.jpeg?auto=compress&w=1600",
    type: "Maison d'architecte",
    place: "Luxembourg",
    title: "Salle de bain master en collaboration architecte",
    body: "Robinetterie design, douche italienne, baignoire îlot, WC lavant, plancher chauffant, sèche-serviettes. Réseau planifié avec l'architecte.",
    techno: "Sanitaire premium · architecte",
    category: "sanitaire",
    tags: ["Architecte", "Premium", "Plancher chauffant"],
  },
  {
    img: "https://images.pexels.com/photos/3760529/pexels-photo-3760529.jpeg?auto=compress&w=1600",
    type: "Résidence collective",
    place: "Luxembourg",
    title: "Contrat d'entretien chaufferie",
    body: "Maintenance préventive et corrective d'une chaufferie collective. Télémaintenance lorsque l'installation est connectée, audit annuel d'efficacité.",
    techno: "Maintenance long terme",
    category: "entretien",
    tags: ["Collectif", "Télémaintenance", "Long terme"],
  },
  {
    img: "https://images.pexels.com/photos/433308/pexels-photo-433308.jpeg?auto=compress&w=1600",
    type: "Transition énergétique",
    place: "Luxembourg",
    title: "Photovoltaïque + batterie + pompe à chaleur",
    body: "Installation photovoltaïque toiture, batterie de stockage, et couplage avec une pompe à chaleur. Autoconsommation pilotée selon tarif énergie.",
    techno: "PV + stockage + PAC",
    category: "enr",
    tags: ["Hybride", "Autoconsommation", "Klimabonus"],
  },
  {
    img: "/PAC-air-air1.jpg",
    type: "Villa privée",
    place: "Luxembourg",
    title: "Remplacement chaudière par PAC air/eau monobloc",
    body: "Installation extérieure soignée, sur plot anti-vibration et lit de galets. Liaisons isolées, régulation connectée.",
    techno: "PAC air/eau monobloc",
    category: "pac",
    tags: ["Rénovation", "Monobloc", "Acoustique"],
  },
  {
    img: "/chauffage.jpg",
    type: "Rénovation maison",
    place: "Luxembourg",
    title: "Chaudière condensation & pilotage par zones",
    body: "Mise à niveau du système de chauffage d'une maison. Nouvelle chaudière condensation, désembouage, équilibrage, programmation horaire par zones.",
    techno: "Gaz condensation · multi-zones",
    category: "chauffage",
    tags: ["Rénovation", "Multi-zones", "Pilotage"],
  },
];

const CATEGORIES = [
  { id: "all", label: "Tous les cas d'usage" },
  { id: "chauffage", label: "Chauffage" },
  { id: "pac", label: "Pompes à chaleur" },
  { id: "clim", label: "Climatisation" },
  { id: "sanitaire", label: "Sanitaire" },
  { id: "entretien", label: "Entretien" },
  { id: "enr", label: "Énergies renouvelables" },
] as const;

export default function RealisationsPage() {
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]["id"]>("all");

  const filtered = useMemo(
    () =>
      filter === "all"
        ? PROJECTS
        : PROJECTS.filter((p) => p.category === filter),
    [filter],
  );

  return (
    <>
      <PageHeader
        number="08"
        eyebrow="Exemples de réalisations"
        title={
          <>
            Cas d&apos;usage typiques —{" "}
            <em className="not-italic text-copper">votre projet ressemble à un de ceux-là</em>.
          </>
        }
        intro={
          <>
            Une sélection de situations types que nous adressons régulièrement. Chaque dossier suit <strong className="text-copper font-semibold">la même méthode</strong> : étude, dimensionnement, pose propre, mise en service.
          </>
        }
        aside={
          <HeroAside
            icon={FolderOpen}
            eyebrow="Typologies couvertes"
            items={[
              { label: "Résidentiel individuel", body: "Villas, rénovations, maisons passives" },
              { label: "Résidentiel collectif", body: "Chaufferies & climatisation immeubles" },
              { label: "Tertiaire", body: "Bureaux, commerces, restauration" },
            ]}
            footnote="Photos d'illustration · galerie clients en constitution"
          />
        }
      />

      {/* DISCLAIMER global */}
      <section className="bg-cream">
        <div className="container">
          <div className="p-4 lg:p-5 rounded-2xl border border-ember/30 bg-ember/8 flex items-start gap-3 text-sm text-ink">
            <Info className="h-5 w-5 text-ember shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Photos d&apos;illustration.</strong> Les cas présentés ci-dessous décrivent
              des situations <strong>typiques</strong> que nous adressons. La galerie de projets
              clients réels avec autorisation de publication est <strong>en cours de
              constitution</strong>. Pour discuter d&apos;un projet précis, écrivez-nous.
            </p>
          </div>
        </div>
      </section>

      {/* AVANT/APRÈS phare */}
      <section className="py-12 lg:py-20 bg-cream">
        <div className="container">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5">
              <Eyebrow number="00">Cas type en vedette</Eyebrow>
              <h2 className="mt-4 font-display text-display-md text-balance text-ink">
                Avant / après —{" "}
                <em className="not-italic text-copper">remplacement de chauffage</em>
              </h2>
              <p className="mt-5 text-graphite leading-relaxed">
                Situation typique de rénovation : remplacement d&apos;une installation vieillissante
                par une solution moderne, avec dépose propre, local technique nettoyé, et
                régulation connectée.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-graphite">
                <li className="flex gap-3">
                  <span className="text-copper">→</span> Dépose et évacuation de l&apos;existant
                </li>
                <li className="flex gap-3">
                  <span className="text-copper">→</span> Local technique remis en état
                </li>
                <li className="flex gap-3">
                  <span className="text-copper">→</span> Mise en service et suivi technique
                </li>
              </ul>
              <div className="mt-8 flex flex-wrap gap-2">
                {["Luxembourg", "PAC", "Rénovation", "Cas type"].map(
                  (t) => (
                    <span
                      key={t}
                      className="px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-eyebrow bg-white border border-ink/10 text-graphite"
                    >
                      {t}
                    </span>
                  ),
                )}
              </div>
            </div>
            <div className="lg:col-span-7">
              <BeforeAfter
                before="https://images.pexels.com/photos/3964341/pexels-photo-3964341.jpeg?auto=compress&w=1600"
                after="/PAC-air-air1.jpg"
                beforeAlt="Installation existante avant rénovation"
                afterAlt="Installation neuve soignée"
                ratio="4/3"
              />
              <p className="mt-3 text-center text-xs text-muted font-mono uppercase tracking-eyebrow">
                Glissez le curseur pour comparer · cas type illustratif
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <section className="pt-12 lg:pt-16 bg-cream">
        <div className="container">
          <div className="border-t border-ink/8 pt-12 lg:pt-16">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
              <div>
                <Eyebrow number="01">Galerie</Eyebrow>
                <h2 className="mt-4 font-display text-display-md text-balance text-ink">
                  Filtrez par métier.
                </h2>
              </div>
              <div className="text-sm text-muted font-mono uppercase tracking-eyebrow">
                {filtered.length} {filtered.length > 1 ? "exemples" : "exemple"}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-12">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFilter(c.id)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm border transition-all",
                    filter === c.id
                      ? "bg-ink text-cream border-ink"
                      : "bg-white border-ink/12 text-graphite hover:border-copper/40 hover:text-copper",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROJECTS GRID */}
      <section className="pb-20 bg-cream">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {filtered.map((p, i) => (
              <motion.article
                key={p.title}
                layout
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: (i % 2) * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className={`group ${i % 2 === 1 ? "lg:mt-20" : ""}`}
              >
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-stone mb-6 shadow-card">
                  <Image
                    src={p.img}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent" />
                  <div className="absolute top-5 left-5 flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] uppercase tracking-eyebrow text-ink bg-cream/90 backdrop-blur-md border border-ink/10 px-3 py-1.5 rounded-full">
                      {p.type}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper bg-cream/90 backdrop-blur-md border border-copper/30 px-3 py-1.5 rounded-full">
                      Cas type
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                  <span className="font-mono uppercase tracking-eyebrow text-muted inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-copper" />
                    {p.place}
                  </span>
                  <span className="h-px w-6 bg-ink/15" />
                  <span className="font-mono uppercase tracking-eyebrow text-graphite inline-flex items-center gap-1">
                    <Cpu className="h-3 w-3 text-copper" />
                    {p.techno}
                  </span>
                </div>

                <h2 className="mt-3 font-display text-3xl lg:text-4xl tracking-tight text-ink text-balance">
                  {p.title}
                </h2>
                <p className="mt-4 text-graphite leading-relaxed">{p.body}</p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {p.tags.map((m) => (
                    <span
                      key={m}
                      className="px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-eyebrow bg-white border border-ink/10 text-graphite"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </motion.article>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20 text-muted">
              Aucun cas affiché — sélectionnez un autre filtre.
            </div>
          )}

          <div className="mt-20 flex justify-center">
            <Link
              href="/devis"
              className="group inline-flex items-center gap-2 rounded-full bg-ink text-cream px-7 py-4 text-sm font-medium hover:bg-copper transition-all hover:-translate-y-0.5"
            >
              Discuter de votre projet
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </section>

      <FinalCTA />
    </>
  );
}
