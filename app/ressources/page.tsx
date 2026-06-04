/**
 * Centre de ressources public — articles métier + outils + guides.
 *
 * Hub central qui regroupe ce qui aide le visiteur à prendre une décision
 * sereine. Renvoie vers les articles existants, les outils interactifs, et
 * les pages métier.
 */

import Link from "next/link";
import type { Metadata } from "next";
import {
  Calculator,
  Wrench,
  Package,
  ShieldCheck,
  FileText,
  TrendingUp,
  BookOpen,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Ressources — guides et outils HVAC Luxembourg",
  description:
    "Calculateurs PAC, ROI 20 ans, vérificateur Klimabonus, auto-diagnostic, guides techniques. Tout ce qu'il faut pour décider sereinement.",
};

type Resource = {
  href: string;
  title: string;
  description: string;
  icon: typeof Calculator;
  badge?: string;
  /** Catégorie pour groupage. */
  group: "outils" | "guides" | "metier";
};

const RESOURCES: Resource[] = [
  {
    href: "/outils/dimensionnement-pac",
    title: "Calculateur dimensionnement PAC",
    description:
      "Estimez la puissance pompe à chaleur adaptée à votre logement selon surface et isolation.",
    icon: Calculator,
    badge: "Outil interactif",
    group: "outils",
  },
  {
    href: "/outils/roi-pac",
    title: "Simulateur ROI 20 ans — PAC vs gaz",
    description:
      "Comparez le coût cumulé sur 20 ans avec hypothèses transparentes et modifiables.",
    icon: TrendingUp,
    badge: "Outil interactif",
    group: "outils",
  },
  {
    href: "/outils/eligibilite-klimabonus",
    title: "Éligibilité Klimabonus",
    description:
      "Vérifiez en 30 secondes votre éligibilité et obtenez une estimation du montant d'aide.",
    icon: ShieldCheck,
    badge: "Outil interactif",
    group: "outils",
  },
  {
    href: "/outils/auto-diagnostic",
    title: "Auto-diagnostic dépannage",
    description:
      "Arbre de questions pour comprendre une panne et savoir si vous pouvez la résoudre seul.",
    icon: Wrench,
    badge: "Outil interactif",
    group: "outils",
  },
  {
    href: "/outils/bibliotheque-equipements",
    title: "Bibliothèque d'équipements",
    description:
      "Catalogue consultable des marques et modèles que nous installons (specs, prix indicatifs).",
    icon: Package,
    badge: "Référentiel",
    group: "outils",
  },
  {
    href: "/simulateur-klimabonus",
    title: "Simulateur Klimabonus (détaillé)",
    description:
      "Version étendue du vérificateur avec breakdown précis par type de travaux.",
    icon: ShieldCheck,
    group: "guides",
  },
  {
    href: "/aides",
    title: "Toutes les aides énergie Luxembourg",
    description:
      "Klimabonus, TVA super-réduite, certificats d'économie d'énergie, primes communales.",
    icon: FileText,
    group: "guides",
  },
  {
    href: "/actualites",
    title: "Articles métier",
    description:
      "Décryptages techniques, retours d'expérience chantiers, évolutions réglementaires.",
    icon: BookOpen,
    group: "guides",
  },
  {
    href: "/services/chauffage",
    title: "Service chauffage",
    description: "Chaudières condensation, biomasse, réseau collectif.",
    icon: FileText,
    group: "metier",
  },
  {
    href: "/services/pompe-a-chaleur",
    title: "Service pompe à chaleur",
    description: "Air/eau, géothermique, hybride — sélection et installation.",
    icon: FileText,
    group: "metier",
  },
  {
    href: "/services/climatisation",
    title: "Service climatisation",
    description: "Mono-split, multi-split, gainable, réversibles.",
    icon: FileText,
    group: "metier",
  },
  {
    href: "/services/energies-renouvelables",
    title: "Service énergies renouvelables",
    description: "Photovoltaïque, solaire thermique, batteries.",
    icon: FileText,
    group: "metier",
  },
];

const GROUP_LABELS: Record<Resource["group"], string> = {
  outils: "Outils interactifs",
  guides: "Guides & dossiers",
  metier: "Pages métier",
};

export default function RessourcesPage() {
  const grouped = RESOURCES.reduce<Record<string, Resource[]>>((acc, r) => {
    if (!acc[r.group]) acc[r.group] = [];
    acc[r.group].push(r);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-cream py-12 lg:py-16">
      <div className="container max-w-6xl">
        <div className="mb-10">
          <Link
            href="/"
            className="text-xs font-mono uppercase tracking-eyebrow text-graphite hover:text-copper"
          >
            ← Retour accueil
          </Link>
          <h1 className="mt-4 font-display text-display-md text-ink">
            Centre de ressources
          </h1>
          <p className="mt-2 text-graphite max-w-2xl">
            Tout ce qu&apos;il faut pour décider sereinement : calculateurs,
            guides aides, auto-diagnostic, références techniques. Aucune
            inscription requise.
          </p>
        </div>

        {(["outils", "guides", "metier"] as const).map((group) => (
          <section key={group} className="mb-12">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-4">
              {GROUP_LABELS[group]}
            </div>
            <div className="grid lg:grid-cols-3 gap-4">
              {grouped[group]?.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="group rounded-2xl border border-ink/10 bg-white shadow-soft p-5 hover:border-copper/40 transition-colors block"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="h-9 w-9 rounded-full grid place-items-center bg-copper/10 border border-copper/30 text-copper shrink-0">
                      <r.icon className="h-4 w-4" />
                    </span>
                    {r.badge && (
                      <span className="text-[10px] font-mono uppercase tracking-eyebrow bg-cream text-graphite px-2 py-0.5 rounded-full">
                        {r.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-base text-ink group-hover:text-copper transition-colors">
                    {r.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-graphite leading-relaxed">
                    {r.description}
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs text-copper font-mono uppercase tracking-eyebrow">
                    Ouvrir
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <div className="rounded-2xl border border-ink/10 bg-ink/5 p-6 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-display text-base text-ink">
              Un cas particulier ?
            </div>
            <p className="text-sm text-graphite mt-1">
              Si aucune ressource ne couvre votre situation, contactez-nous —
              on prend le temps de comprendre.
            </p>
          </div>
          <Link
            href="/devis"
            className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper transition-colors"
          >
            Nous contacter
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
