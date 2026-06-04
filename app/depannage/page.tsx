"use client";

import { motion } from "framer-motion";
import { Phone, Clock, Wrench, Truck, AlertCircle } from "lucide-react";
import { Eyebrow, Reveal, SectionTitle, Button } from "@/components/ui";
import { HeroAside } from "@/components/hero-aside";
import { FinalCTA } from "@/components/home/cta";
import { COMPANY } from "@/lib/company-info";

export default function DepannagePage() {
  return (
    <>
      {/* HERO URGENCE */}
      <section className="relative pt-12 lg:pt-16 pb-10 overflow-hidden bg-cream">
        <div className="absolute inset-0 bg-ember-glow opacity-100 pointer-events-none" />
        <div className="absolute inset-0 bg-grid [background-size:64px_64px] opacity-50 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />

        <div className="container relative">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-ember/12 border border-ember/40">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-ember"></span>
            </span>
            <span className="font-mono text-[11px] uppercase tracking-eyebrow text-ember">
              Astreinte 24/7 · Disponible maintenant
            </span>
          </div>

          <Reveal>
            <h1 className="mt-5 font-display text-display-2xl tracking-tightest max-w-5xl text-balance text-ink">
              Plus de chaud, plus d'eau —{" "}
              <em className="not-italic text-ember">parlez-nous, on s&apos;organise</em>.
            </h1>
          </Reveal>

          <div className="mt-6 grid lg:grid-cols-12 gap-8 lg:gap-12 items-end">
            <Reveal delay={1} className="lg:col-span-7">
              <p className="text-xl text-graphite max-w-2xl text-balance">
                Intervention dépannage selon disponibilité, <strong className="text-ember font-semibold">diagnostic prioritaire</strong>, organisation rapide. Conditions d&apos;astreinte précisées au téléphone.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-stretch gap-3">
                <a
                  href={`tel:${COMPANY.phone.tel}`}
                  className="group inline-flex items-center justify-center gap-3 rounded-full bg-ember text-cream px-8 py-5 text-base font-semibold hover:bg-ember/90 transition-all hover:-translate-y-0.5 shadow-card"
                >
                  <Phone className="h-5 w-5" />
                  Nous contacter dépannage
                </a>
                <Button href="/contact" variant="ghost">
                  Urgence non-vitale (formulaire)
                </Button>
              </div>
            </Reveal>

            <Reveal delay={2} className="lg:col-span-5">
              <HeroAside
                icon={AlertCircle}
                tone="ember"
                eyebrow="Situations couvertes"
                items={[
                  { label: "Chaudière en panne", body: "Plus de chauffage ni d'eau chaude" },
                  { label: "Fuite d'eau", body: "Mise en sécurité et intervention rapide" },
                  { label: "Clim KO en canicule", body: "Compresseur, fluide, condensats" },
                ]}
                footnote="Pré-diagnostic au téléphone · pièces selon stock"
              />
            </Reveal>
          </div>

          <Reveal delay={3}>
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-px bg-ink/8 border border-ink/8 rounded-2xl overflow-hidden">
              <Stat label="Appel" value="Direct" />
              <Stat label="Diagnostic" value="Prioritaire" />
              <Stat label="Astreinte" value="Sur demande" />
              <Stat label="Tarification" value="Sur devis" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* SITUATIONS */}
      <section className="py-14 lg:py-20 bg-linen border-y border-ink/8">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <Eyebrow number="01">Quand nous appeler</Eyebrow>
            <Reveal>
              <SectionTitle className="mt-4">
                Les situations où chaque heure compte.
              </SectionTitle>
            </Reveal>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-ink/8 border border-ink/8 rounded-2xl overflow-hidden">
            {[
              { icon: AlertCircle, title: "Chaudière en panne", body: "Plus de chauffage ni d'eau chaude, code défaut affiché, brûleur qui se coupe en sécurité." },
              { icon: AlertCircle, title: "Fuite d'eau", body: "Canalisation percée, joint qui lâche, robinet bloqué ouvert. Coupure générale et intervention rapide." },
              { icon: AlertCircle, title: "Clim KO en canicule", body: "Compresseur qui tourne sans froid, fuite de fluide, condensats qui débordent au plafond." },
              { icon: AlertCircle, title: "Plus d'eau chaude", body: "Ballon HS, thermostat défectueux, panne de circulateur sur instantané gaz." },
              { icon: AlertCircle, title: "PAC qui dégivre en boucle", body: "Cycle dégivrage qui ne s'arrête pas, alarme givrage, ventilateur bloqué." },
              { icon: AlertCircle, title: "Évacuation bouchée", body: "WC, douche, évier qui refoulent. Curage haute pression, caméra d'inspection." },
            ].map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.08 }}
                className="bg-white p-8"
              >
                <s.icon className="h-5 w-5 text-ember" />
                <h3 className="mt-4 font-display text-2xl text-ink tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm text-graphite leading-relaxed">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS D'URGENCE */}
      <section className="py-14 lg:py-20 bg-cream">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <Eyebrow number="02">Le déroulé</Eyebrow>
            <Reveal>
              <SectionTitle className="mt-4">
                Cinq étapes, chacune chronométrée.
              </SectionTitle>
            </Reveal>
          </div>

          <div className="grid md:grid-cols-5 gap-6">
            {[
              { icon: Phone, t: "Étape 01", title: "Appel", body: "Pré-diagnostic au téléphone selon les symptômes décrits. Conseils immédiats si possible." },
              { icon: Clock, t: "Étape 02", title: "Organisation", body: "Affectation d'un technicien disponible et confirmation du créneau d'intervention." },
              { icon: Truck, t: "Étape 03", title: "Arrivée", body: "Déplacement en zone Luxembourg selon disponibilité de l'équipe et urgence du dossier." },
              { icon: Wrench, t: "Étape 04", title: "Diagnostic", body: "Lecture défauts, mesures, identification de la cause. Devis transparent communiqué." },
              { icon: Clock, t: "Étape 05", title: "Intervention", body: "Réparation selon disponibilité des pièces. Mise en sécurité immédiate si nécessaire." },
            ].map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="relative"
              >
                <div className="font-mono text-[11px] uppercase tracking-eyebrow text-ember">
                  {s.t}
                </div>
                <div className="mt-4 h-12 w-12 rounded-full bg-ember/10 border border-ember/30 grid place-items-center">
                  <s.icon className="h-5 w-5 text-ember" />
                </div>
                <h3 className="mt-5 font-display text-xl text-ink tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm text-graphite leading-relaxed">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section className="py-14 lg:py-20 bg-linen border-y border-ink/8">
        <div className="container">
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5">
              <Eyebrow number="03">Tarification</Eyebrow>
              <Reveal>
                <SectionTitle className="mt-4">
                  Devis communiqué avant intervention.
                </SectionTitle>
              </Reveal>
              <Reveal delay={1}>
                <p className="mt-6 text-graphite">
                  La tarification dépend du type d&apos;intervention, du créneau (ouvrable, soir,
                  week-end), et du diagnostic réalisé. Elle est toujours communiquée et validée
                  avant tout travail.
                </p>
              </Reveal>
            </div>
            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-px bg-ink/8 border border-ink/8 rounded-2xl overflow-hidden">
              {[
                { t: "Déplacement & diagnostic", p: "Sur devis", s: "Heures ouvrables · Luxembourg" },
                { t: "Astreinte hors heures ouvrables", p: "Sur devis", s: "Soirs · week-ends · majoration" },
                { t: "Contrat client", p: "Selon contrat", s: "Conditions précisées au contrat" },
                { t: "Pièces & main-d'œuvre", p: "Sur devis", s: "Détaillées après diagnostic" },
              ].map((p) => (
                <div key={p.t} className="bg-white p-6">
                  <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                    {p.t}
                  </div>
                  <div className="mt-2 font-display text-2xl text-ink">{p.p}</div>
                  <div className="mt-1 text-xs text-muted">{p.s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <FinalCTA />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-6">
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">{label}</div>
      <div className="mt-2 font-display text-3xl text-ember">{value}</div>
    </div>
  );
}
