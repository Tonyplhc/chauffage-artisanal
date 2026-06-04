"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ArrowRight,
  Users,
  Building2,
  Package,
  Inbox,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { DemoSeedCard } from "@/components/admin/demo-seed-card";

type Steps = {
  multiUserSetup: boolean;
  brandConfigured: boolean;
  catalogueUploaded: boolean;
  firstLead: boolean;
  twoFactor: boolean;
};

const STEP_DEFS: {
  key: keyof Steps;
  icon: typeof Users;
  title: string;
  desc: string;
  href: string;
  cta: string;
}[] = [
  {
    key: "multiUserSetup",
    icon: Users,
    title: "Créer le premier utilisateur",
    desc: "Passez du mot de passe unique à des comptes multi-utilisateurs avec rôles.",
    href: "/admin/users",
    cta: "Gérer les utilisateurs",
  },
  {
    key: "brandConfigured",
    icon: Building2,
    title: "Personnaliser l'identité",
    desc: "Nom, tagline, coordonnées, couleurs accent. Propage partout sur le site.",
    href: "/admin/brand",
    cta: "Configurer la marque",
  },
  {
    key: "catalogueUploaded",
    icon: Package,
    title: "Importer le catalogue",
    desc: "Excel/CSV avec vos références. Permet la génération automatique de 3 propositions par lead.",
    href: "/admin/catalogue",
    cta: "Importer le catalogue",
  },
  {
    key: "firstLead",
    icon: Inbox,
    title: "Recevoir le premier lead",
    desc: "Soumettez un test via /devis ou attendez votre première demande client.",
    href: "/devis",
    cta: "Tester le devis",
  },
  {
    key: "twoFactor",
    icon: ShieldCheck,
    title: "Activer le 2FA",
    desc: "Renforcer la sécurité des connexions admin avec un code OTP (Google Authenticator…).",
    href: "/admin/2fa",
    cta: "Activer le 2FA",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [data, setData] = useState<{ steps: Steps; completed: number; total: number } | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/onboarding/status", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const json = await res.json();
      setData(json);
    })();
  }, [router]);

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-3xl">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour pipeline
        </Link>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-copper/10 border border-copper/30 mb-4">
            <Sparkles className="h-6 w-6 text-copper" />
          </div>
          <h1 className="font-display text-display-md text-ink">
            Bienvenue à bord
          </h1>
          <p className="mt-3 text-graphite max-w-md mx-auto">
            Quelques étapes pour configurer votre pipeline et tirer le maximum de
            l&apos;outil.
          </p>
        </div>

        {/* Progress */}
        {data && (
          <div className="mb-8 p-5 rounded-2xl bg-white border border-ink/10 shadow-soft">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                Avancement
              </span>
              <span className="text-sm text-ink tabular-nums">
                {data.completed} / {data.total}
              </span>
            </div>
            <div className="h-2 rounded-full bg-ink/5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-copper to-ember rounded-full transition-all duration-500"
                style={{ width: `${(data.completed / data.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Démo & seed */}
        <div className="mb-6">
          <DemoSeedCard />
        </div>

        {/* Steps */}
        <div className="grid gap-3">
          {data === null ? (
            <div className="p-12 text-center text-muted">Chargement…</div>
          ) : (
            STEP_DEFS.map((s, i) => {
              const done = data.steps[s.key];
              return (
                <div
                  key={s.key}
                  className={`rounded-2xl border p-5 lg:p-6 transition-all ${
                    done
                      ? "bg-[#22a06b]/5 border-[#22a06b]/30"
                      : "bg-white border-ink/10 hover:border-copper/40"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={`h-10 w-10 rounded-full grid place-items-center border shrink-0 ${
                        done
                          ? "bg-[#22a06b]/15 border-[#22a06b]/40 text-[#22a06b]"
                          : "bg-cream border-ink/15 text-graphite"
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                          Étape {i + 1}
                        </span>
                        {done && (
                          <span className="font-mono text-[10px] uppercase tracking-eyebrow text-[#22a06b] bg-[#22a06b]/10 border border-[#22a06b]/40 px-2 py-0.5 rounded-full">
                            Validé
                          </span>
                        )}
                      </div>
                      <div className="mt-1 font-display text-xl text-ink">{s.title}</div>
                      <p className="mt-1.5 text-sm text-graphite leading-relaxed">{s.desc}</p>
                      {!done && (
                        <Link
                          href={s.href}
                          className="mt-3 inline-flex items-center gap-2 rounded-full bg-ink text-cream px-4 py-2 text-sm font-medium hover:bg-copper transition-colors"
                        >
                          {s.cta}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
