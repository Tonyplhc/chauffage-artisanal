"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, MapPin, Briefcase, Clock, Users, Send } from "lucide-react";
import { PageHeader, Eyebrow, Reveal, SectionTitle, Button } from "@/components/ui";
import { HeroAside } from "@/components/hero-aside";
import { FinalCTA } from "@/components/home/cta";
import type { JobRecord } from "@/lib/jobs-store";

const CONTRACT_LABELS: Record<string, string> = {
  CDI: "CDI",
  CDD: "CDD",
  interim: "Intérim",
  alternance: "Alternance",
  stage: "Stage",
  freelance: "Indépendant",
};

const WORK_TIME_LABELS: Record<string, string> = {
  plein: "Temps plein",
  partiel: "Temps partiel",
};

function fmtSalary(min?: number, max?: number): string | null {
  if (!min && !max) return null;
  if (min && max) return `${min.toLocaleString("fr-FR")} – ${max.toLocaleString("fr-FR")} €/mois`;
  if (min) return `À partir de ${min.toLocaleString("fr-FR")} €/mois`;
  return `Jusqu'à ${(max ?? 0).toLocaleString("fr-FR")} €/mois`;
}

const PERKS = [
  { t: "Rémunération attractive", b: "Conditions discutées au cas par cas, alignées sur l'expérience et le poste." },
  { t: "Outillage et équipements pros", b: "Matériel professionnel pour travailler dans de bonnes conditions." },
  { t: "Formation continue", b: "Possibilité de formation constructeurs et perfectionnement technique." },
  { t: "Véhicule pour techniciens", b: "Selon poste, véhicule de service mis à disposition." },
  { t: "Couverture santé", b: "Selon poste et durée de contrat, conditions précisées à l'embauche." },
  { t: "Équilibre vie pro/perso", b: "Organisation respectueuse des collaborateurs." },
];

const JOBS = [
  {
    title: "Technicien chauffagiste expérimenté",
    type: "Profil typique",
    place: "Luxembourg",
    hours: "Selon poste",
    body: "Pour piloter les installations résidentielles et petites chaufferies collectives. Profil avec plusieurs années d'expérience et lecture de schémas hydrauliques.",
    tags: ["Chauffage", "PAC", "Expérimenté"],
  },
  {
    title: "Frigoriste tertiaire",
    type: "Profil typique",
    place: "Luxembourg",
    hours: "Selon poste",
    body: "Pour intervenir sur installations multi-zones, salles techniques, et grands tertiaires. Habilitations en froid requises selon réglementation.",
    tags: ["Climatisation", "Tertiaire"],
  },
  {
    title: "Apprenti(e) chauffagiste",
    type: "Apprentissage",
    place: "Luxembourg",
    hours: "Alternance",
    body: "Intégration en apprentissage, encadrement par un référent technique. Montée en compétence progressive sur la durée de la formation.",
    tags: ["Junior", "Formation"],
  },
  {
    title: "Plombier sanitaire",
    type: "Profil typique",
    place: "Luxembourg",
    hours: "Selon poste",
    body: "Pour les chantiers de salles de bain exigeantes. Lecture de plans, sens de la finition, travail en lien avec architectes.",
    tags: ["Sanitaire", "Premium"],
  },
  {
    title: "Bureau d'études PAC",
    type: "Profil typique",
    place: "Luxembourg",
    hours: "Selon poste",
    body: "Pour réaliser les dimensionnements PAC et hybrides. Maîtrise des outils de simulation, profil ingénieur ou technicien expérimenté.",
    tags: ["Bureau d'études", "PAC"],
  },
  {
    title: "Technicien SAV / dépannage",
    type: "Profil typique",
    place: "Luxembourg",
    hours: "Selon poste",
    body: "Pour intervenir sur dépannages et entretiens. Autonomie, sens du diagnostic, relation client soignée.",
    tags: ["Dépannage", "SAV"],
  },
];

export default function RecrutementPage() {
  // Liste live des offres ouvertes (fetch depuis /api/recrutement)
  const [liveJobs, setLiveJobs] = useState<JobRecord[] | null>(null);
  useEffect(() => {
    fetch("/api/recrutement", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setLiveJobs(d?.jobs ?? []))
      .catch(() => setLiveJobs([]));
  }, []);

  return (
    <>
      <PageHeader
        number="10"
        eyebrow="Recrutement"
        title={
          <>
            Rejoindre une maison qui forme,{" "}
            <em className="not-italic text-bleu">qui équipe, qui paie correctement</em>.
          </>
        }
        intro={
          <>
            <strong className="text-bleu font-semibold">Six postes ouverts en permanence</strong>. Chez nous, vous arrivez le matin avec une caisse à outils neuve, un camion qui démarre, et un planning qui tient.
          </>
        }
        aside={
          <HeroAside
            icon={Users}
            eyebrow="Postes types ouverts"
            items={[
              { label: "Techniciens chauffage / frigo", body: "Résidentiel & tertiaire" },
              { label: "Plombier sanitaire", body: "Chantiers d'architecte premium" },
              { label: "Apprenti / alternant", body: "Encadrement référent technique" },
            ]}
            footnote="Outillage pro · formation continue · véhicule selon poste"
          />
        }
      />

      <section className="relative bg-creme">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            className="relative aspect-[21/9] rounded-3xl overflow-hidden shadow-card"
          >
            <Image
              src="https://images.pexels.com/photos/8487391/pexels-photo-8487391.jpeg?auto=compress&w=2400"
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/40 to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* PERKS */}
      <section className="py-14 lg:py-20 bg-creme">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <Eyebrow number="01">Ce que nous offrons</Eyebrow>
            <Reveal>
              <SectionTitle className="mt-4">
                Les conditions concrètes, pas les slogans.
              </SectionTitle>
            </Reveal>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-sable/60 border border-pierre rounded-2xl overflow-hidden">
            {PERKS.map((p, i) => (
              <motion.div
                key={p.t}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.08 }}
                className="bg-white p-8"
              >
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu">
                  0{i + 1}
                </div>
                <h3 className="mt-3 font-display text-xl text-anthra">{p.t}</h3>
                <p className="mt-2 text-sm text-taupe leading-relaxed">{p.b}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* JOBS — chargés depuis l'API en live */}
      <section className="py-14 lg:py-20 bg-creme border-y border-pierre">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <Eyebrow number="02">Postes ouverts</Eyebrow>
            <Reveal>
              <SectionTitle className="mt-4">
                {liveJobs === null
                  ? "Chargement des offres…"
                  : liveJobs.length === 0
                  ? "Aucun poste ouvert ce mois-ci"
                  : `${liveJobs.length} ${liveJobs.length > 1 ? "postes ouverts" : "poste ouvert"}`}
              </SectionTitle>
            </Reveal>
          </div>

          <div className="grid gap-4">
            {liveJobs === null ? (
              // Skeleton loading
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 rounded-2xl border border-pierre bg-white animate-pulse"
                />
              ))
            ) : liveJobs.length === 0 ? (
              <div className="p-10 rounded-2xl border border-pierre bg-white text-center">
                <p className="text-taupe">
                  Pas d&apos;offre active pour le moment. Vous pouvez toujours envoyer une{" "}
                  <Link
                    href="/recrutement/candidature"
                    className="text-bleu font-medium hover:underline"
                  >
                    candidature spontanée
                  </Link>{" "}
                  — nous lisons tout.
                </p>
              </div>
            ) : (
              liveJobs.map((j, i) => {
                const salaryStr = fmtSalary(j.salaryMin, j.salaryMax);
                return (
                  <motion.div
                    key={j.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6, delay: i * 0.05 }}
                    className="group p-6 lg:p-8 rounded-2xl border border-pierre bg-white hover:border-bleu/40 hover:shadow-lift transition-all"
                  >
                    <div className="grid lg:grid-cols-12 gap-6 items-start">
                      <div className="lg:col-span-5">
                        <div className="flex flex-wrap gap-2">
                          <span className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu bg-bleu/10 border border-bleu/30 px-2 py-1 rounded-full">
                            {CONTRACT_LABELS[j.contractType] ?? j.contractType}
                          </span>
                          <span className="font-mono text-[10px] uppercase tracking-eyebrow text-taupe bg-creme border border-pierre px-2 py-1 rounded-full">
                            {WORK_TIME_LABELS[j.workTime] ?? j.workTime}
                          </span>
                        </div>
                        <h3 className="mt-3 font-display text-2xl text-anthra tracking-tight">
                          {j.title}
                        </h3>
                        {salaryStr && (
                          <div className="mt-2 font-mono text-xs text-bleu">
                            💰 {salaryStr}
                          </div>
                        )}
                      </div>
                      <div className="lg:col-span-5 text-sm text-taupe leading-relaxed line-clamp-4 whitespace-pre-line">
                        {j.description}
                      </div>
                      <div className="lg:col-span-2 flex flex-col gap-2 text-xs text-taupe font-mono uppercase tracking-eyebrow">
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="h-3 w-3" /> {CONTRACT_LABELS[j.contractType] ?? j.contractType}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3" /> Luxembourg
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" /> Publié{" "}
                          {new Date(j.publishedAt).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </div>
                    </div>
                    {j.benefits.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {j.benefits.slice(0, 4).map((b) => (
                          <span
                            key={b}
                            className="text-xs text-taupe bg-creme/60 border border-pierre px-2.5 py-1 rounded-full"
                          >
                            ✓ {b}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-6 pt-6 border-t border-pierre flex items-center justify-between">
                      <span className="text-xs text-muted">
                        CV PDF + 30 secondes pour postuler
                      </span>
                      <Link
                        href={`/recrutement/candidature?jobId=${j.id}`}
                        className="inline-flex items-center gap-2 rounded-full bg-navy text-creme px-4 py-2 text-sm font-medium hover:bg-bleu transition-colors"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Postuler
                      </Link>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          <div className="mt-10 text-center">
            <p className="text-taupe">
              Vous ne voyez pas votre poste ? Envoyez-nous une candidature spontanée — nous lisons
              tout.
            </p>
            <div className="mt-6">
              <Button href="/recrutement/candidature" variant="primary">
                Candidature spontanée
              </Button>
            </div>
          </div>
        </div>
      </section>

      <FinalCTA />
    </>
  );
}
