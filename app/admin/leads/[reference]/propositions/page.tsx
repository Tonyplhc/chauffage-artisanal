"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Package,
  AlertCircle,
  Printer,
  Mail,
  ArrowRight,
  Trophy,
  Plus,
  Minus,
  TrendingDown,
  TrendingUp,
  Crown,
} from "lucide-react";
import type { LeadRecord } from "@/lib/devis-schema";
import type { CatalogueItem } from "@/lib/catalogue-schema";
import { cn } from "@/lib/utils";

const SERVICE_LABEL: Record<string, string> = {
  chauffage: "Chauffage",
  pac: "Pompe à chaleur",
  clim: "Climatisation",
  sanitaire: "Sanitaire",
  enr: "Énergies renouv.",
  depannage: "Dépannage",
  autre: "Autre",
};

type Tier = "low" | "mid" | "high";

type TieredProposition = {
  tier: Tier;
  tierLabel: string;
  item: CatalogueItem | null;
  reasoning: string;
};

const TIER_META: Record<
  Tier,
  { color: string; icon: any; gradientFrom: string; subtitle: string }
> = {
  low: {
    color: "#94a3a3",
    icon: TrendingDown,
    gradientFrom: "from-[#94a3a3]/8",
    subtitle: "Solution accessible",
  },
  mid: {
    color: "#b86a36",
    icon: Trophy,
    gradientFrom: "from-copper/12",
    subtitle: "Recommandée — dans le budget",
  },
  high: {
    color: "#22a06b",
    icon: Crown,
    gradientFrom: "from-[#22a06b]/8",
    subtitle: "Premium — au-dessus du budget",
  },
};

export default function PropositionsPage() {
  const params = useParams<{ reference: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<LeadRecord | null>(null);
  const [tiers, setTiers] = useState<TieredProposition[] | null>(null);
  const [hasCatalogue, setHasCatalogue] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/leads/${params.reference}/propositions`, {
          cache: "no-store",
        });
        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = await res.json();
        setLead(data.lead);
        setTiers(data.tiers);
        setHasCatalogue(data.hasCatalogue);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.reference, router]);

  if (loading || !lead) {
    return (
      <div className="min-h-screen bg-cream grid place-items-center text-muted">
        Chargement…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14 print:py-4">
      <div className="container max-w-6xl">
        <div className="mb-8 print:hidden">
          <Link
            href={`/admin/leads/${lead.reference}`}
            className="inline-flex items-center gap-2 text-sm text-graphite hover:text-copper transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Retour au dossier
          </Link>
        </div>

        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
              Propositions · dossier {lead.reference}
            </div>
            <h1 className="mt-3 font-display text-display-md text-ink flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-copper" />
              3 solutions pour {lead.fullName.split(" ")[0]}
            </h1>
            <p className="mt-3 text-graphite text-sm max-w-xl">
              Une option <strong>en-dessous</strong>, une <strong>dans la fourchette</strong>,
              une <strong>au-dessus</strong> du budget annoncé. Sélection effectuée dans votre
              catalogue interne.
            </p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm bg-white hover:border-copper/40 transition-colors"
            >
              <Printer className="h-4 w-4" /> Imprimer
            </button>
            <a
              href={`mailto:${lead.email}?subject=Propositions pour votre projet ${lead.reference}`}
              className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper transition-colors"
            >
              <Mail className="h-4 w-4" /> Envoyer par mail
            </a>
          </div>
        </div>

        {/* Lead context */}
        <div className="mb-8 p-5 rounded-2xl border border-ink/10 bg-white shadow-soft">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-3">
            Contexte du projet
          </div>
          <div className="grid sm:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted mb-1">Services</div>
              <div className="font-medium text-ink">
                {lead.services.map((s) => SERVICE_LABEL[s]).join(" · ")}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">Surface</div>
              <div className="font-medium text-ink">{lead.surface} m²</div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">Budget indicatif</div>
              <div className="font-medium text-copper">{budgetLabel(lead.budget)}</div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">Délai</div>
              <div className="font-medium text-ink">{timelineLabel(lead.timeline)}</div>
            </div>
          </div>
        </div>

        {hasCatalogue === false ? (
          <EmptyCatalogue />
        ) : !tiers || tiers.every((t) => !t.item) ? (
          <NoMatch services={lead.services} />
        ) : (
          <div className="grid lg:grid-cols-3 gap-5 items-stretch">
            {tiers.map((t, i) => (
              <TierCard
                key={t.tier}
                proposition={t}
                isHighlighted={t.tier === "mid"}
                index={i}
              />
            ))}
          </div>
        )}

        <div className="mt-10 p-4 rounded-2xl bg-cream border border-ink/10 text-xs text-muted flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-copper shrink-0 mt-0.5" />
          <p>
            Ces propositions sont <strong className="text-ink">pré-suggestions</strong> tirées
            de votre catalogue interne. Le devis définitif reste à valider par votre bureau
            d&apos;études après visite technique.
          </p>
        </div>
      </div>
    </div>
  );
}

function TierCard({
  proposition,
  isHighlighted,
  index,
}: {
  proposition: TieredProposition;
  isHighlighted: boolean;
  index: number;
}) {
  const meta = TIER_META[proposition.tier];

  if (!proposition.item) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="rounded-3xl border border-dashed border-ink/15 bg-white/60 p-6 flex flex-col items-center justify-center text-center min-h-[320px]"
      >
        <div
          className="h-12 w-12 rounded-full grid place-items-center border mb-4"
          style={{ background: `${meta.color}15`, borderColor: `${meta.color}55`, color: meta.color }}
        >
          <meta.icon className="h-5 w-5" />
        </div>
        <div className="font-mono text-[10px] uppercase tracking-eyebrow" style={{ color: meta.color }}>
          {proposition.tierLabel}
        </div>
        <div className="mt-2 font-display text-lg text-ink">Aucune référence</div>
        <div className="mt-2 text-xs text-graphite max-w-xs">{proposition.reasoning}</div>
      </motion.div>
    );
  }

  const item = proposition.item;
  const hasPrice = item.priceMin != null || item.priceMax != null;
  const priceText = hasPrice
    ? item.priceMin != null && item.priceMax != null
      ? `${item.priceMin.toLocaleString("fr-FR")} – ${item.priceMax.toLocaleString("fr-FR")} €`
      : `${(item.priceMin ?? item.priceMax)?.toLocaleString("fr-FR")} €`
    : "Sur devis";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={cn(
        "relative rounded-3xl border bg-white p-6 lg:p-7 shadow-soft flex flex-col print:break-inside-avoid",
        `bg-gradient-to-br ${meta.gradientFrom} to-white`,
        isHighlighted ? "lg:-mt-4 lg:mb-4 ring-2 shadow-lift" : "",
      )}
      style={
        isHighlighted
          ? { borderColor: meta.color, boxShadow: `0 0 0 1px ${meta.color}40` }
          : { borderColor: "rgba(42,37,30,0.1)" }
      }
    >
      {isHighlighted && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-cream text-[10px] font-mono uppercase tracking-eyebrow"
          style={{ backgroundColor: meta.color }}
        >
          <Trophy className="h-3 w-3" />
          Cible budget
        </div>
      )}

      {/* Tier header */}
      <div className="flex items-center gap-2 mb-1">
        <span
          className="h-7 w-7 rounded-full grid place-items-center"
          style={{ background: `${meta.color}1A`, color: meta.color }}
        >
          <meta.icon className="h-3.5 w-3.5" />
        </span>
        <div>
          <div
            className="font-mono text-[10px] uppercase tracking-eyebrow leading-none"
            style={{ color: meta.color }}
          >
            {proposition.tierLabel}
          </div>
          <div className="text-[10px] text-muted leading-tight">{meta.subtitle}</div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-eyebrow bg-copper/10 border border-copper/30 text-copper">
          {SERVICE_LABEL[item.service] ?? item.service}
        </span>
        <span className="font-mono text-[10px] text-muted">{item.ref}</span>
      </div>

      <div className="mt-3 font-display text-2xl text-ink leading-tight">{item.name}</div>
      {item.brand && (
        <div className="text-xs text-muted mt-0.5">
          {item.brand}
          {item.power && ` · ${item.power}`}
        </div>
      )}

      {item.description && (
        <p className="mt-3 text-sm text-graphite leading-relaxed">{item.description}</p>
      )}

      <div className="mt-5 mb-5 p-4 rounded-2xl bg-cream border border-ink/8">
        <div className="font-mono text-[9px] uppercase tracking-eyebrow text-muted mb-1">
          Prix indicatif HT · {item.unit}
        </div>
        <div className="font-display text-2xl text-ink">{priceText}</div>
      </div>

      {(item.advantages.length > 0 || item.inconvenients.length > 0) && (
        <div className="space-y-4 mb-5">
          {item.advantages.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-eyebrow text-[#22a06b] mb-2">
                <Plus className="h-3 w-3" /> Avantages
              </div>
              <ul className="space-y-1.5 text-sm">
                {item.advantages.map((a) => (
                  <li key={a} className="flex gap-2 text-graphite">
                    <span className="text-[#22a06b] mt-0.5">✓</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {item.inconvenients.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-eyebrow text-ember mb-2">
                <Minus className="h-3 w-3" /> Points d&apos;attention
              </div>
              <ul className="space-y-1.5 text-sm">
                {item.inconvenients.map((a) => (
                  <li key={a} className="flex gap-2 text-graphite">
                    <span className="text-ember mt-0.5">·</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-ink/8 text-xs text-graphite italic">
        {proposition.reasoning}
      </div>
    </motion.div>
  );
}

function EmptyCatalogue() {
  return (
    <div className="rounded-3xl border border-dashed border-ink/15 bg-white p-12 text-center">
      <Package className="h-12 w-12 text-muted mx-auto mb-4" />
      <div className="font-display text-xl text-ink mb-2">Aucun catalogue importé</div>
      <p className="text-sm text-graphite max-w-md mx-auto mb-6">
        Pour générer des propositions automatiques, importez votre fichier Excel/CSV avec vos
        propres références et prix dans le catalogue interne.
      </p>
      <Link
        href="/admin/catalogue"
        className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm font-medium hover:bg-copper transition-colors"
      >
        Configurer le catalogue
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function NoMatch({ services }: { services: string[] }) {
  return (
    <div className="rounded-3xl border border-ember/30 bg-ember/8 p-8 text-center">
      <AlertCircle className="h-10 w-10 text-ember mx-auto mb-3" />
      <div className="font-display text-xl text-ink mb-2">Aucune référence ne correspond</div>
      <p className="text-sm text-graphite max-w-md mx-auto">
        Votre catalogue ne contient pas de références pour les services demandés.
        Ajoutez des entrées pour :{" "}
        <strong>{services.map((s) => SERVICE_LABEL[s] ?? s).join(", ")}</strong>.
      </p>
      <Link
        href="/admin/catalogue"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm font-medium hover:bg-copper transition-colors"
      >
        Ouvrir le catalogue
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function budgetLabel(b: string): string {
  return (
    {
      less10: "< 10 k€",
      "10-20": "10 – 20 k€",
      "20-40": "20 – 40 k€",
      "40plus": "> 40 k€",
      inconnu: "Non précisé",
    } as Record<string, string>
  )[b] ?? b;
}

function timelineLabel(t: string): string {
  return (
    {
      urgent: "Urgent",
      court: "Sous 3 mois",
      annee: "Cette année",
      exploration: "Exploration",
    } as Record<string, string>
  )[t] ?? t;
}
