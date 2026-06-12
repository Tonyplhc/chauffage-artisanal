"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Flame, Snowflake, Droplets, Leaf, Wrench, Zap } from "lucide-react";
import { Eyebrow, Reveal } from "@/components/ui";

// Helper visuel pour mettre un fragment en évidence (bleu) dans une blurb.
const H = ({ children }: { children: React.ReactNode }) => (
  <strong className="text-bleu font-semibold">{children}</strong>
);

type Service = {
  href: string;
  nr: string;
  icon: typeof Flame;
  title: string;
  blurb: React.ReactNode;
  img: string;
  accent: "bleu" | "bleuvif" | "terracotta";
};

const SERVICES: Service[] = [
  {
    href: "/chauffage",
    nr: "01",
    icon: Flame,
    title: "Chauffage",
    blurb: (
      <>
        Chaudières condensation, systèmes hybrides, mise aux normes, optimisation
        énergétique. De la maison individuelle au <H>tertiaire 4 000 m²</H>.
      </>
    ),
    img: "/chauffage.jpg",
    accent: "bleu",
  },
  {
    href: "/pompes-a-chaleur",
    nr: "02",
    icon: Leaf,
    title: "Pompes à chaleur",
    blurb: (
      <>
        Air/eau, géothermie, hybride. Études de dimensionnement,{" "}
        <H>accompagnement Klimabonus</H>, <H>COP &gt; 4,8</H> mesurés sur nos
        installations 2024.
      </>
    ),
    img: "/PAC-air-air1.jpg",
    accent: "bleu",
  },
  {
    href: "/climatisation",
    nr: "03",
    icon: Snowflake,
    title: "Climatisation",
    blurb: (
      <>
        Mono-split, multi-split, VRV/VRF. Bureaux, commerces, salles techniques.{" "}
        <H>Maintenance prédictive</H> et contrats SLA tertiaires.
      </>
    ),
    img: "/reparation-climatisation-2.jpeg",
    accent: "bleuvif",
  },
  {
    href: "/sanitaire",
    nr: "04",
    icon: Droplets,
    title: "Sanitaire",
    blurb: (
      <>
        Salles de bain haut de gamme, plomberie complète, traitement de l&apos;eau,{" "}
        <H>rénovations clé en main</H> avec nos partenaires architectes.
      </>
    ),
    img: "/sanitaire.jpg",
    accent: "bleu",
  },
  {
    href: "/depannage",
    nr: "05",
    icon: Wrench,
    title: "Dépannage 24/7",
    blurb: (
      <>
        <H>Astreinte permanente, 365 jours par an</H>.{" "}
        <H>Diagnostic sous 2h</H>, pièces en stock, redémarrage rapide même en pleine
        vague de froid.
      </>
    ),
    img: "https://images.pexels.com/photos/8487377/pexels-photo-8487377.jpeg?auto=compress&w=1400",
    accent: "terracotta",
  },
  {
    href: "/energies-renouvelables",
    nr: "06",
    icon: Zap,
    title: "Énergies renouvelables",
    blurb: (
      <>
        Solaire thermique, photovoltaïque couplé PAC, batteries.{" "}
        <H>Audit complet</H> de votre bâtiment et{" "}
        <H>plan de transition sur 10 ans</H>.
      </>
    ),
    img: "https://images.pexels.com/photos/433308/pexels-photo-433308.jpeg?auto=compress&w=1400",
    accent: "bleu",
  },
];

export function Services() {
  return (
    <section id="services" className="relative py-14 lg:py-20 bg-creme border-y border-pierre font-ui">
      <div className="container relative">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-10 lg:mb-14">
          <div>
            <Eyebrow number="03">Nos métiers</Eyebrow>
            <Reveal>
              <h2 className="mt-5 font-display text-display-lg max-w-3xl text-balance text-anthra">
                Six savoir-faires, une seule <em className="not-italic text-bleu">maison technique</em>.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={1}>
            <p className="max-w-md text-taupe">
              Chaque domaine est piloté par une{" "}
              <strong className="text-bleu font-semibold">équipe dédiée</strong>,{" "}
              <strong className="text-bleu font-semibold">formée en interne</strong>, avec ses{" "}
              <strong className="text-bleu font-semibold">propres outils</strong>, ses{" "}
              <strong className="text-bleu font-semibold">fournisseurs partenaires</strong> et ses{" "}
              <strong className="text-bleu font-semibold">protocoles de qualité</strong>.
            </p>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7">
          {SERVICES.map((s, i) => (
            <ServiceCard key={s.href} {...s} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({
  href,
  nr,
  icon: Icon,
  title,
  blurb,
  img,
  accent,
  index,
}: (typeof SERVICES)[number] & { index: number }) {
  const accentColor =
    accent === "terracotta"
      ? "text-terracotta"
      : accent === "bleuvif"
        ? "text-bleuvif"
        : "text-bleu";
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay: (index % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="group relative bg-white rounded-3xl border border-pierre hover:border-bleu/40 transition-all duration-500 hover:shadow-lift overflow-hidden"
    >
      <Link href={href} className="block">
        <div className="relative aspect-[5/3] overflow-hidden bg-pierre">
          <Image
            src={img}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/25 to-transparent" />
          <div className="absolute top-4 left-4 grid place-items-center h-10 w-10 rounded-full bg-creme/85 backdrop-blur-md border border-pierre">
            <Icon className={`h-4 w-4 ${accentColor}`} />
          </div>
          <div className="absolute top-4 right-4 font-mono text-[10px] uppercase tracking-eyebrow text-anthra bg-creme/85 backdrop-blur-md border border-pierre px-2.5 py-1 rounded-full">
            {nr}
          </div>
        </div>

        <div className="p-7 lg:p-8">
          <h3 className="font-display text-3xl text-anthra tracking-tight">{title}</h3>
          <p className="mt-4 text-taupe leading-relaxed">{blurb}</p>
          <div className="mt-6 inline-flex items-center gap-2 text-sm text-anthra group-hover:text-bleu transition-colors">
            <span className="uppercase font-mono tracking-eyebrow text-[11px]">Découvrir</span>
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
