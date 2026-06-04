"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Palette,
  Building2,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Loader2,
  RotateCcw,
} from "lucide-react";
import type { BrandSettings } from "@/lib/brand-settings-types";
import { DEFAULT_BRAND } from "@/lib/brand-settings-types";
import { cn } from "@/lib/utils";

export default function BrandPage() {
  const router = useRouter();
  const [brand, setBrand] = useState<BrandSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/brand", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const data = await res.json();
      setBrand(data.brand);
    })();
  }, [router]);

  const update = <K extends keyof BrandSettings>(k: K, v: BrandSettings[K]) => {
    if (!brand) return;
    setBrand({ ...brand, [k]: v });
  };

  const updateSocial = (key: "linkedin" | "instagram" | "facebook", value: string) => {
    if (!brand) return;
    const socials = { ...(brand.socials ?? {}) };
    if (value) socials[key] = value;
    else delete socials[key];
    setBrand({ ...brand, socials });
  };

  const save = async () => {
    if (!brand) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brand),
      });
      const data = await res.json();
      if (res.ok) {
        setBrand(data.brand);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        setError(data.error ?? "Erreur");
      }
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    if (confirm("Restaurer toutes les valeurs par défaut ?")) {
      setBrand(DEFAULT_BRAND);
    }
  };

  if (!brand) {
    return (
      <div className="min-h-screen bg-cream grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-copper" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-5xl">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour pipeline
        </Link>

        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="font-display text-display-md text-ink">
              Branding & contenus
            </h1>
            <p className="mt-2 text-graphite">
              Personnaliser le nom, les coordonnées et les couleurs accent. Propagation
              dans le nav, footer, emails et meta tags.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-2.5 text-sm bg-white hover:border-copper/40 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Restaurer défauts
            </button>
            <button
              onClick={save}
              disabled={saving}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors",
                saving ? "bg-ink/15 text-ink/40 cursor-not-allowed" : "bg-ink text-cream hover:bg-copper",
              )}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saved ? "Enregistré ✓" : "Enregistrer"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl border border-ember/40 bg-ember/5 text-sm text-ember">
            {error}
          </div>
        )}
        {saved && (
          <div className="mb-6 p-4 rounded-2xl border border-[#22a06b]/40 bg-[#22a06b]/5 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-[#22a06b] shrink-0 mt-0.5" />
            <div className="text-sm text-ink">
              Changements enregistrés. Rechargez le site public pour les voir
              propager.
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Identité */}
          <Section icon={Building2} title="Identité">
            <Field label="Nom de l'entreprise">
              <input
                type="text"
                value={brand.name}
                onChange={(e) => update("name", e.target.value)}
                className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink focus:border-copper focus:outline-none"
              />
            </Field>
            <Field label="Tagline (sous le nom)">
              <input
                type="text"
                value={brand.tagline}
                onChange={(e) => update("tagline", e.target.value)}
                className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink focus:border-copper focus:outline-none"
              />
            </Field>
            <Field label="Description courte (SEO, OG, footer)">
              <textarea
                rows={3}
                value={brand.shortDescription}
                onChange={(e) => update("shortDescription", e.target.value)}
                className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink focus:border-copper focus:outline-none resize-none"
              />
            </Field>
            <Field label="Année de fondation">
              <input
                type="number"
                min={1900}
                max={new Date().getFullYear()}
                value={brand.foundedYear}
                onChange={(e) => update("foundedYear", Number(e.target.value) || brand.foundedYear)}
                className="w-32 bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink focus:border-copper focus:outline-none tabular-nums"
              />
            </Field>
          </Section>

          {/* Couleurs */}
          <Section icon={Palette} title="Couleurs accent">
            <Field label="Accent primaire (copper par défaut)">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={brand.colorAccent}
                  onChange={(e) => update("colorAccent", e.target.value)}
                  className="h-10 w-16 rounded-lg border border-ink/12 cursor-pointer"
                />
                <input
                  type="text"
                  value={brand.colorAccent}
                  onChange={(e) => update("colorAccent", e.target.value)}
                  className="flex-1 bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink font-mono focus:border-copper focus:outline-none"
                />
              </div>
            </Field>
            <Field label="Accent secondaire (ember par défaut)">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={brand.colorAccentSecondary}
                  onChange={(e) => update("colorAccentSecondary", e.target.value)}
                  className="h-10 w-16 rounded-lg border border-ink/12 cursor-pointer"
                />
                <input
                  type="text"
                  value={brand.colorAccentSecondary}
                  onChange={(e) => update("colorAccentSecondary", e.target.value)}
                  className="flex-1 bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink font-mono focus:border-copper focus:outline-none"
                />
              </div>
            </Field>
            <Field label="Logo (URL ou data URI)">
              <input
                type="text"
                placeholder="Optionnel · /logo.png ou data:image/svg+xml,..."
                value={brand.logoUrl ?? ""}
                onChange={(e) => update("logoUrl", e.target.value || undefined)}
                className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink font-mono focus:border-copper focus:outline-none"
              />
            </Field>

            <div className="mt-2 p-4 rounded-xl bg-cream border border-ink/8">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2">
                Aperçu accent
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className="px-4 py-1.5 rounded-full text-xs font-medium text-white"
                  style={{ background: brand.colorAccent }}
                >
                  Primaire
                </span>
                <span
                  className="px-4 py-1.5 rounded-full text-xs font-medium text-white"
                  style={{ background: brand.colorAccentSecondary }}
                >
                  Secondaire
                </span>
                <span
                  className="px-4 py-1.5 rounded-full text-xs font-medium border"
                  style={{
                    color: brand.colorAccent,
                    background: brand.colorAccent + "15",
                    borderColor: brand.colorAccent + "55",
                  }}
                >
                  Soft
                </span>
              </div>
            </div>
          </Section>

          {/* Contact */}
          <Section icon={Phone} title="Coordonnées">
            <Field label="Email">
              <input
                type="email"
                value={brand.contactEmail}
                onChange={(e) => update("contactEmail", e.target.value)}
                className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink focus:border-copper focus:outline-none"
              />
            </Field>
            <Field label="Téléphone">
              <input
                type="text"
                value={brand.contactPhone}
                onChange={(e) => update("contactPhone", e.target.value)}
                className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink font-mono focus:border-copper focus:outline-none"
              />
            </Field>
            <Field label="Adresse complète">
              <input
                type="text"
                value={brand.contactAddress}
                onChange={(e) => update("contactAddress", e.target.value)}
                className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink focus:border-copper focus:outline-none"
              />
            </Field>
            <Field label="Label ville (nav)">
              <input
                type="text"
                value={brand.cityLabel}
                onChange={(e) => update("cityLabel", e.target.value)}
                className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink focus:border-copper focus:outline-none"
              />
            </Field>
            <Field label="Disponibilité urgence">
              <input
                type="text"
                value={brand.emergencyAvailability}
                onChange={(e) => update("emergencyAvailability", e.target.value)}
                className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink focus:border-copper focus:outline-none"
              />
            </Field>
          </Section>

          {/* Socials */}
          <Section icon={Mail} title="Réseaux sociaux (optionnels)">
            <Field label="LinkedIn URL">
              <input
                type="url"
                placeholder="https://www.linkedin.com/company/..."
                value={brand.socials?.linkedin ?? ""}
                onChange={(e) => updateSocial("linkedin", e.target.value)}
                className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink focus:border-copper focus:outline-none"
              />
            </Field>
            <Field label="Instagram URL">
              <input
                type="url"
                placeholder="https://www.instagram.com/..."
                value={brand.socials?.instagram ?? ""}
                onChange={(e) => updateSocial("instagram", e.target.value)}
                className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink focus:border-copper focus:outline-none"
              />
            </Field>
            <Field label="Facebook URL">
              <input
                type="url"
                placeholder="https://www.facebook.com/..."
                value={brand.socials?.facebook ?? ""}
                onChange={(e) => updateSocial("facebook", e.target.value)}
                className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink focus:border-copper focus:outline-none"
              />
            </Field>
          </Section>
        </div>

        {/* Aperçu propagation */}
        <div className="mt-8 p-5 rounded-2xl border border-ink/10 bg-white">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
            Où ces données sont utilisées
          </div>
          <ul className="grid sm:grid-cols-2 gap-2 text-xs text-graphite">
            <li>✓ Nav (nom + cityLabel)</li>
            <li>✓ Footer (description courte, contact, socials)</li>
            <li>✓ Meta tags SEO (title, description, OG)</li>
            <li>✓ Page contact (toutes les coordonnées)</li>
            <li>✓ Emails admin & client (header)</li>
            <li>✓ Page récap PDF (footer)</li>
            <li>✓ Page espace client</li>
            <li>✓ Devis officiel public</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Building2;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-6 lg:p-7 rounded-2xl bg-white border border-ink/10 shadow-soft">
      <div className="flex items-center gap-2 mb-5">
        <Icon className="h-5 w-5 text-copper" />
        <h2 className="font-display text-xl text-ink">{title}</h2>
      </div>
      <div className="grid gap-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2">
        {label}
      </div>
      {children}
    </label>
  );
}
