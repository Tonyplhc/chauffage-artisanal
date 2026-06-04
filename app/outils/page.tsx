import Link from "next/link";
import {
  ArrowUpRight,
  Calculator,
  Leaf,
  Settings2,
  Sparkles,
  Stethoscope,
  TrendingUp,
  Library,
} from "lucide-react";
import { Eyebrow, SectionTitle } from "@/components/ui";

export const metadata = {
  title: "Outils gratuits — Calculateurs, simulateurs, diagnostics",
  description:
    "Suite d'outils gratuits : calculateur d'économies, ROI pompe à chaleur, dimensionnement PAC, vérificateur Klimabonus, auto-diagnostic dépannage, bibliothèque équipements.",
  alternates: { canonical: "/outils" },
};

const TOOLS = [
  {
    href: "/outils/economies-energie",
    icon: Calculator,
    title: "Calculateur d'économies d'énergie",
    description:
      "4 questions → 3 scénarios calculés en temps réel (PAC, chauffe-eau thermo, PV). Coûts qui scalent avec votre logement, ROI estimé.",
    badge: "Nouveau",
    primary: true,
  },
  {
    href: "/outils/roi-pac",
    icon: TrendingUp,
    title: "Simulateur ROI pompe à chaleur",
    description:
      "Coût cumulé année par année sur 20 ans : chaudière gaz vs PAC. Hypothèses transparentes, année de break-even, économie totale.",
    badge: "Pédagogique",
  },
  {
    href: "/outils/dimensionnement-pac",
    icon: Settings2,
    title: "Dimensionnement PAC",
    description:
      "Calcul de la puissance de pompe à chaleur adaptée à votre logement : surface, isolation, zone climatique. Fourchette indicative.",
    badge: "Technique",
  },
  {
    href: "/outils/eligibilite-klimabonus",
    icon: Sparkles,
    title: "Vérificateur Klimabonus",
    description:
      "Êtes-vous éligible aux aides Klimabonus 2026 ? Quelques questions, et l'estimation de l'enveloppe applicable à votre projet.",
    badge: "Aides",
  },
  {
    href: "/outils/auto-diagnostic",
    icon: Stethoscope,
    title: "Auto-diagnostic dépannage",
    description:
      "Votre chauffage fait du bruit, ne démarre plus, fuit ? L'auto-diagnostic vous oriente vers la bonne action avant l'appel technicien.",
    badge: "Urgence",
  },
  {
    href: "/outils/bibliotheque-equipements",
    icon: Library,
    title: "Bibliothèque équipements",
    description:
      "Catalogue technique des équipements que nous installons : chaudières, PAC, climatisation, chauffe-eau. Fiches détaillées par modèle.",
    badge: "Catalogue",
  },
];

export default function OutilsHub() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-12 lg:pt-16 pb-10 lg:pb-12 bg-cream border-b border-ink/8 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(184,106,54,0.35), transparent 55%), radial-gradient(circle at 80% 70%, rgba(184,106,54,0.18), transparent 55%)",
          }}
        />
        <div className="container relative">
          <div className="max-w-3xl">
            <Eyebrow number="00">Outils gratuits</Eyebrow>
            <h1 className="mt-4 font-display text-display-xl tracking-tightest text-balance text-ink">
              6 outils pour{" "}
              <em className="not-italic text-copper">orienter votre projet</em> avant le devis.
            </h1>
            <p className="mt-5 text-lg lg:text-xl text-graphite leading-relaxed text-balance">
              Calculateurs, simulateurs, vérificateurs Klimabonus, auto-diagnostic. Toutes les
              hypothèses sont transparentes. Aucune saisie d&apos;email requise — c&apos;est
              fait pour orienter, pas pour collecter.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-copper/10 border border-copper/30 text-[10px] font-mono uppercase tracking-eyebrow text-copper">
                <Leaf className="h-3 w-3" />
                100 % gratuit
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-ink/15 text-[10px] font-mono uppercase tracking-eyebrow text-graphite">
                Sans inscription
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-ink/15 text-[10px] font-mono uppercase tracking-eyebrow text-graphite">
                Hypothèses transparentes
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Grille des outils */}
      <section className="py-14 lg:py-20 bg-linen border-b border-ink/8">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <Eyebrow number="01">Catalogue</Eyebrow>
            <SectionTitle className="mt-4">
              Le bon outil <em className="not-italic text-copper">au bon moment</em>.
            </SectionTitle>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TOOLS.map((t) => {
              const Icon = t.icon;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`group p-6 lg:p-7 rounded-2xl border bg-white hover:shadow-lift transition-all flex flex-col ${
                    t.primary
                      ? "border-copper/40 shadow-soft"
                      : "border-ink/10 hover:border-copper/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`grid place-items-center h-12 w-12 rounded-full border shrink-0 ${
                        t.primary
                          ? "bg-copper/15 border-copper/40"
                          : "bg-copper/10 border-copper/25"
                      }`}
                    >
                      <Icon className="h-5 w-5 text-copper" />
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-eyebrow ${
                        t.primary
                          ? "bg-copper text-cream"
                          : "bg-cream text-graphite border border-ink/10"
                      }`}
                    >
                      {t.badge}
                    </span>
                  </div>
                  <h2 className="mt-5 font-display text-xl text-ink tracking-tight">
                    {t.title}
                  </h2>
                  <p className="mt-2 text-sm text-graphite leading-relaxed flex-1">
                    {t.description}
                  </p>
                  <div className="mt-5 pt-5 border-t border-ink/8 inline-flex items-center justify-between text-xs font-mono uppercase tracking-eyebrow text-graphite group-hover:text-copper transition-colors">
                    Ouvrir
                    <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Suite : pour quand on veut un vrai devis */}
      <section className="py-14 lg:py-20 bg-cream">
        <div className="container grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7">
            <Eyebrow number="02">Au-delà des outils</Eyebrow>
            <SectionTitle className="mt-4">
              Un outil oriente —{" "}
              <em className="not-italic text-copper">un devis tranche</em>.
            </SectionTitle>
            <p className="mt-5 text-graphite leading-relaxed">
              Nos calculateurs donnent des ordres de grandeur honnêtes. Pour passer du chiffre
              au projet réel, il faut une visite technique : isolation réelle, contraintes du
              bâtiment, exposition, consommation historique. C&apos;est ce qu&apos;on fait
              gratuitement, sans engagement.
            </p>
          </div>
          <aside className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="rounded-2xl border border-copper/30 bg-gradient-to-br from-cream to-white p-7 shadow-soft">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                Étude personnalisée
              </div>
              <h3 className="mt-3 font-display text-2xl text-ink tracking-tight">
                Devis détaillé sous 24h
              </h3>
              <p className="mt-4 text-sm text-graphite leading-relaxed">
                Visite gratuite, étude bureau d&apos;études, accompagnement Klimabonus. Pas de
                pression commerciale.
              </p>
              <Link
                href="/devis"
                className="mt-6 inline-flex items-center justify-between gap-2 rounded-full bg-ink text-cream px-5 py-3.5 text-sm font-medium hover:bg-copper transition-colors w-full group"
              >
                Demander un devis
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
