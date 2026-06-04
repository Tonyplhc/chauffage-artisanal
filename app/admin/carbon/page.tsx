"use client";

/**
 * Dashboard empreinte carbone — agrégation CO2 évité grâce aux conversions.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Leaf,
  TreePine,
  Car,
  TrendingDown,
  ArrowRight,
  Printer,
} from "lucide-react";

type Report = {
  reference: string;
  fullName: string;
  fromEnergy: string;
  toEnergy: string;
  annualKwh: number;
  co2FromKgPerYear: number;
  co2ToKgPerYear: number;
  co2SavedKgPerYear: number;
};

type Totals = {
  convertedCount: number;
  annualCo2SavedKg: number;
  lifetimeCo2SavedKg: number;
  equivalentTreesPlanted: number;
  equivalentCarsRetired: number;
};

const ENERGY_LABELS: Record<string, string> = {
  fioul: "Fioul",
  gaz: "Gaz",
  electrique: "Électrique",
  pac: "Pompe à chaleur",
  bois: "Bois",
  autre: "Autre",
  inconnu: "Inconnu",
};

function formatKg(v: number) {
  if (v >= 1000) {
    return `${(v / 1000).toFixed(1).replace(/\.0$/, "")} t`;
  }
  return `${v.toLocaleString("fr-FR")} kg`;
}

export default function CarbonPage() {
  const router = useRouter();
  const [data, setData] = useState<{
    reports: Report[];
    totals: Totals;
  } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/carbon-footprint", {
      cache: "no-store",
    });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) setData(await res.json());
  }, [router]);

  useEffect(() => {
    load();
    const i = setInterval(load, 120_000);
    return () => clearInterval(i);
  }, [load]);

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-5xl">
        <div className="flex items-center justify-between gap-3 mb-6 print:hidden">
          <Link
            href="/admin/leads"
            className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour pipeline
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-full bg-white border border-ink/15 px-4 py-2 text-sm hover:border-copper/40"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimer livrable
          </button>
        </div>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-[#22a06b] bg-[#22a06b]/10 border border-[#22a06b]/30 px-3 py-1 rounded-full">
            <Leaf className="h-3 w-3" />
            Impact environnemental
          </div>
          <h1 className="mt-3 font-display text-display-md text-ink">
            Empreinte carbone évitée
          </h1>
          <p className="mt-2 text-graphite max-w-2xl">
            Estimation des émissions CO₂ évitées grâce aux installations
            converties (chaudière fioul → PAC, etc.). Méthode : facteurs ADEME
            indicatifs × consommation annuelle estimée par dossier.
          </p>
        </div>

        {!data ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : (
          <>
            <div className="grid lg:grid-cols-4 gap-4 mb-8">
              <Kpi
                icon={<TrendingDown className="h-4 w-4 text-[#22a06b]" />}
                label="CO₂ évité / an"
                value={formatKg(data.totals.annualCo2SavedKg)}
                hint={`${data.totals.convertedCount} dossiers convertis`}
                accent="success"
              />
              <Kpi
                icon={<Leaf className="h-4 w-4 text-[#22a06b]" />}
                label="Sur 15 ans"
                value={formatKg(data.totals.lifetimeCo2SavedKg)}
                hint="durée de vie installations"
              />
              <Kpi
                icon={<TreePine className="h-4 w-4 text-[#22a06b]" />}
                label="Équivalent arbres"
                value={data.totals.equivalentTreesPlanted.toLocaleString(
                  "fr-FR",
                )}
                hint="plantés par an"
              />
              <Kpi
                icon={<Car className="h-4 w-4 text-graphite" />}
                label="Voitures retirées"
                value={data.totals.equivalentCarsRetired.toLocaleString(
                  "fr-FR",
                )}
                hint="équivalent annuel"
              />
            </div>

            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
              <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 flex items-center gap-2">
                <Leaf className="h-4 w-4 text-[#22a06b]" />
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-[#22a06b]">
                  Détail par dossier ({data.reports.length})
                </span>
              </div>
              {data.reports.length === 0 ? (
                <div className="py-12 text-center text-muted text-sm">
                  Aucun dossier converti avec bascule énergétique mesurable.
                </div>
              ) : (
                <ul className="divide-y divide-ink/8">
                  {data.reports.map((r) => (
                    <li
                      key={r.reference}
                      className="px-5 py-3 grid lg:grid-cols-12 gap-3 items-center"
                    >
                      <div className="lg:col-span-4 min-w-0">
                        <Link
                          href={`/admin/leads/${r.reference}`}
                          className="text-sm font-medium text-ink hover:text-copper truncate block"
                        >
                          {r.fullName}
                        </Link>
                        <div className="text-[11px] text-muted font-mono">
                          {r.reference}
                        </div>
                      </div>
                      <div className="lg:col-span-4 flex items-center gap-2 text-xs">
                        <span className="text-ember bg-ember/10 px-2 py-0.5 rounded-full font-mono">
                          {ENERGY_LABELS[r.fromEnergy] ?? r.fromEnergy}
                        </span>
                        <ArrowRight className="h-3 w-3 text-graphite" />
                        <span className="text-[#22a06b] bg-[#22a06b]/10 px-2 py-0.5 rounded-full font-mono">
                          {ENERGY_LABELS[r.toEnergy] ?? r.toEnergy}
                        </span>
                      </div>
                      <div className="lg:col-span-2 text-right text-xs text-graphite font-mono">
                        {r.annualKwh.toLocaleString("fr-FR")} kWh/an
                      </div>
                      <div className="lg:col-span-2 text-right">
                        <div className="font-mono text-sm text-[#22a06b] tabular-nums">
                          −{formatKg(r.co2SavedKgPerYear)}/an
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="mt-4 text-xs text-muted">
              Méthode : Conso annuelle estimée (surface × 90 kWh/m² ou 12 000
              kWh/défaut) × facteur CO₂ par énergie. Facteurs ADEME :
              fioul 0.27 / gaz 0.20 / élec 0.08 / PAC 0.022 / bois 0.03
              kg CO₂/kWh.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  accent?: "success";
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-muted">
        {icon}
        {label}
      </div>
      <div
        className={`mt-2 font-display text-2xl tabular-nums ${
          accent === "success" ? "text-[#22a06b]" : "text-ink"
        }`}
      >
        {value}
      </div>
      {hint && <div className="text-xs text-muted mt-1">{hint}</div>}
    </div>
  );
}
