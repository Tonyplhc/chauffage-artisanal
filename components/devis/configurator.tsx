"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/track-event";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Leaf,
  Snowflake,
  Droplets,
  Wrench,
  Zap,
  HelpCircle,
  Home,
  Building,
  Building2,
  Briefcase,
  Hammer,
  Sparkles,
  Phone,
  Mail,
  MessageSquare,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Camera,
  Upload,
  X,
  Lock,
  Info,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BRANDS, BRAND_SLUGS } from "@/lib/brands-content";
import {
  budgetToTier,
  checkFit,
  getFitMessage,
  suggestAlternatives,
} from "@/lib/brand-budget-matcher";

/* ──────────────────────── TYPES & STRUCTURE DATA (CRM-ready) ──────────────────────── */

export type LeadDevis = {
  reference: string;
  submittedAt: string;

  // Step 1 — multi-select
  services: ServiceId[];

  // Step 2
  buildingType?: BuildingId;
  construction?: ConstructionId;

  // Step 3
  surface: number;
  currentEnergy?: EnergyId;
  commune: string;

  // Step 4
  timeline?: TimelineId;
  budget?: BudgetId;

  // Step 5 — préférence de marque (optionnelle, default = "aucune")
  preferredBrand: BrandPreferenceId;

  // Step 6
  photos: PhotoEntry[];

  // Step 7
  fullName: string;
  email: string;
  phone: string;
  preferredChannel?: ChannelId;
  message: string;
  rgpdConsent: boolean;

  metadata: {
    userAgent?: string;
    locale?: string;
  };
};

type ServiceId =
  | "chauffage"
  | "pac"
  | "clim"
  | "sanitaire"
  | "enr"
  | "depannage"
  | "autre";
type BuildingId = "maison" | "appartement" | "collectif" | "tertiaire" | "autre";
type ConstructionId = "neuf" | "renovation";
type EnergyId =
  | "fioul"
  | "gaz"
  | "electrique"
  | "bois"
  | "pac"
  | "autre"
  | "inconnu";
type TimelineId = "urgent" | "court" | "annee" | "exploration";
type BudgetId =
  | "less10"
  | "10-25"
  | "25-50"
  | "50-100"
  | "100plus"
  // Legacy (lus depuis base, jamais saisis par le formulaire actuel)
  | "10-20"
  | "20-40"
  | "40plus"
  | "inconnu";
type ChannelId = "phone" | "email" | "sms" | "whatsapp";
type BrandPreferenceId =
  | "aucune"
  | "vaillant"
  | "viessmann"
  | "daikin"
  | "mitsubishi"
  | "buderus"
  | "atlantic"
  | "bosch"
  | "de-dietrich"
  | "hoval";
type PhotoEntry = { name: string; size: number; type: string; dataUrl: string };

/* ──────────────────────── DICTIONNAIRES ──────────────────────── */

const SERVICES: { id: ServiceId; label: string; icon: any; hint: string }[] = [
  { id: "chauffage", label: "Chauffage", icon: Flame, hint: "Chaudière, radiateurs, plancher" },
  { id: "pac", label: "Pompe à chaleur", icon: Leaf, hint: "Air/eau, géothermie, hybride" },
  { id: "clim", label: "Climatisation", icon: Snowflake, hint: "Split, multi-split, tertiaire" },
  { id: "sanitaire", label: "Sanitaire", icon: Droplets, hint: "Salle de bain, plomberie" },
  { id: "enr", label: "Énergies renouvelables", icon: Zap, hint: "Solaire, batterie, hybride" },
  { id: "depannage", label: "Dépannage", icon: Wrench, hint: "Panne, fuite, urgence" },
  { id: "autre", label: "Autre projet", icon: HelpCircle, hint: "À préciser dans le message" },
];

const BUILDINGS: { id: BuildingId; label: string; icon: any }[] = [
  { id: "maison", label: "Maison individuelle", icon: Home },
  { id: "appartement", label: "Appartement", icon: Building },
  { id: "collectif", label: "Immeuble collectif", icon: Building2 },
  { id: "tertiaire", label: "Bureaux / tertiaire", icon: Briefcase },
  { id: "autre", label: "Autre type", icon: HelpCircle },
];

const CONSTRUCTIONS: { id: ConstructionId; label: string; hint: string }[] = [
  { id: "neuf", label: "Construction neuve", hint: "Dimensionnement complet" },
  { id: "renovation", label: "Rénovation", hint: "Sur installation existante" },
];

const ENERGIES: { id: EnergyId; label: string }[] = [
  { id: "fioul", label: "Fioul" },
  { id: "gaz", label: "Gaz naturel / GPL" },
  { id: "electrique", label: "Électrique" },
  { id: "bois", label: "Bois / pellets" },
  { id: "pac", label: "Pompe à chaleur" },
  { id: "autre", label: "Autre énergie" },
  { id: "inconnu", label: "Je ne sais pas" },
];

const TIMELINES: { id: TimelineId; label: string; hint: string; urgent?: boolean }[] = [
  { id: "urgent", label: "Urgent", hint: "Sous 2 semaines · panne ou priorité", urgent: true },
  { id: "court", label: "Sous 3 mois", hint: "Projet cadré, dossier prêt" },
  { id: "annee", label: "Cette année", hint: "Réflexion en cours, calendrier ouvert" },
  { id: "exploration", label: "Pas de date fixée", hint: "Je m'informe pour plus tard" },
];

const BUDGETS: { id: BudgetId; label: string; hint: string }[] = [
  { id: "less10", label: "Moins de 10 000 €", hint: "Petits travaux, remplacement simple" },
  { id: "10-25", label: "10 000 – 25 000 €", hint: "Chaudière + accompagnement, PAC d'appoint" },
  { id: "25-50", label: "25 000 – 50 000 €", hint: "PAC complète, salle de bain premium" },
  { id: "50-100", label: "50 000 – 100 000 €", hint: "Rénovation multi-postes, biomasse, hybride" },
  { id: "100plus", label: "Plus de 100 000 €", hint: "Refonte complète, tertiaire, projet d'exception" },
  { id: "inconnu", label: "Je ne sais pas encore", hint: "Nous vous aiderons à estimer" },
];

const CHANNELS: { id: ChannelId; label: string; icon: any }[] = [
  { id: "phone", label: "Appel téléphonique", icon: Phone },
  { id: "email", label: "Email", icon: Mail },
  { id: "sms", label: "SMS", icon: MessageSquare },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
];

const COMMUNE_SUGGESTIONS = [
  "Luxembourg-Ville",
  "Esch-sur-Alzette",
  "Differdange",
  "Cloche d'Or",
  "Kirchberg",
  "Strassen",
  "Bertrange",
  "Mamer",
  "Mersch",
  "Diekirch",
];

const STEPS = [
  "Projet",
  "Bâtiment",
  "Contexte",
  "Délai & budget",
  "Marque",
  "Photos",
  "Vous",
] as const;

// Options affichées dans l'étape "Marque" — toutes les marques de l'encyclopédie
// + "Aucune préférence" en tête. Construit à partir de BRANDS pour rester
// synchronisé avec /lib/brands-content.ts.
const BRAND_OPTIONS: { id: BrandPreferenceId; label: string; hint: string }[] = [
  {
    id: "aucune",
    label: "Pas de préférence",
    hint: "Nous proposerons la marque la plus adaptée à votre projet.",
  },
  ...BRAND_SLUGS.map((slug) => {
    const b = BRANDS[slug];
    return {
      id: slug as BrandPreferenceId,
      label: b.name,
      hint: b.shortPitch,
    };
  }),
];

const MAX_PHOTOS = 5;
const MAX_PHOTO_SIZE = 8 * 1024 * 1024; // 8 MB

/* ──────────────────────── COMPONENT PRINCIPAL ──────────────────────── */

function makeReference() {
  const code = Math.floor(Math.random() * 9000) + 1000;
  return `DEV-${new Date().getFullYear()}-${code}`;
}

/* ─────────── BROUILLON LOCAL (localStorage, sans PII) ─────────── */

const DRAFT_KEY = "devis-draft-v1";
const DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

// Champs persistés : contexte projet uniquement + nombre de photos.
// Jamais : fullName, email, phone, message, trap, rgpdConsent, fichiers/noms photos.
type DraftData = Partial<{
  services: ServiceId[];
  buildingType: BuildingId;
  construction: ConstructionId;
  surface: number;
  currentEnergy: EnergyId;
  commune: string;
  timeline: TimelineId;
  budget: BudgetId;
  preferredBrand: BrandPreferenceId;
  preferredChannel: ChannelId;
  photosCount: number;
}>;
type DraftEnvelope = { v: 1; savedAt: number; data: DraftData };

const _service = new Set<string>(SERVICES.map((s) => s.id));
const _building = new Set<string>(BUILDINGS.map((b) => b.id));
const _construction = new Set<string>(CONSTRUCTIONS.map((c) => c.id));
const _energy = new Set<string>(ENERGIES.map((e) => e.id));
const _timeline = new Set<string>(TIMELINES.map((t) => t.id));
const _budget = new Set<string>(BUDGETS.map((b) => b.id));
const _channel = new Set<string>(CHANNELS.map((c) => c.id));
const _brand = new Set<string>([
  "aucune", "vaillant", "viessmann", "daikin", "mitsubishi",
  "buderus", "atlantic", "bosch", "de-dietrich", "hoval",
]);

function createInitialLead(): LeadDevis {
  return {
    reference: makeReference(),
    submittedAt: "",
    services: [],
    surface: 150,
    commune: "",
    preferredBrand: "aucune",
    photos: [],
    fullName: "",
    email: "",
    phone: "",
    message: "",
    rgpdConsent: false,
    metadata: {},
  };
}

// Vrai si au moins un champ persisté est renseigné → évite un brouillon vide.
function hasContent(l: LeadDevis): boolean {
  return (
    l.services.length > 0 ||
    !!l.commune ||
    !!l.buildingType ||
    !!l.construction ||
    !!l.currentEnergy ||
    !!l.timeline ||
    !!l.budget ||
    l.preferredBrand !== "aucune" ||
    !!l.preferredChannel ||
    l.photos.length > 0
  );
}

function saveDraft(l: LeadDevis): void {
  if (typeof window === "undefined" || !hasContent(l)) return;
  try {
    const data: DraftData = {
      services: l.services,
      buildingType: l.buildingType,
      construction: l.construction,
      surface: l.surface,
      currentEnergy: l.currentEnergy,
      commune: l.commune,
      timeline: l.timeline,
      budget: l.budget,
      preferredBrand: l.preferredBrand,
      preferredChannel: l.preferredChannel,
      photosCount: l.photos.length,
    };
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ v: 1, savedAt: Date.now(), data }),
    );
  } catch {
    // localStorage indispo (mode privé, quota) — échec silencieux
  }
}

function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

// Charge + valide strictement. Purge si invalide ou expiré. Renvoie un patch sûr.
function loadDraft(): { patch: Partial<LeadDevis>; photoCount: number } | null {
  if (typeof window === "undefined") return null;
  let env: DraftEnvelope | null = null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    env = JSON.parse(raw) as DraftEnvelope;
  } catch {
    return null;
  }
  if (
    !env ||
    env.v !== 1 ||
    typeof env.savedAt !== "number" ||
    Date.now() - env.savedAt > DRAFT_TTL_MS
  ) {
    clearDraft();
    return null;
  }
  const d = env.data ?? {};
  const o: Partial<LeadDevis> = {};

  if (Array.isArray(d.services)) {
    const v = d.services.filter(
      (s): s is ServiceId => typeof s === "string" && _service.has(s),
    );
    if (v.length) o.services = Array.from(new Set(v));
  }
  if (typeof d.buildingType === "string" && _building.has(d.buildingType)) o.buildingType = d.buildingType as BuildingId;
  if (typeof d.construction === "string" && _construction.has(d.construction)) o.construction = d.construction as ConstructionId;
  if (typeof d.surface === "number" && Number.isFinite(d.surface)) o.surface = Math.min(1000, Math.max(30, Math.round(d.surface)));
  if (typeof d.currentEnergy === "string" && _energy.has(d.currentEnergy)) o.currentEnergy = d.currentEnergy as EnergyId;
  if (typeof d.commune === "string" && d.commune.trim()) o.commune = d.commune.slice(0, 120);
  if (typeof d.timeline === "string" && _timeline.has(d.timeline)) o.timeline = d.timeline as TimelineId;
  if (typeof d.budget === "string" && _budget.has(d.budget)) o.budget = d.budget as BudgetId;
  if (typeof d.preferredBrand === "string" && _brand.has(d.preferredBrand)) o.preferredBrand = d.preferredBrand as BrandPreferenceId;
  if (typeof d.preferredChannel === "string" && _channel.has(d.preferredChannel)) o.preferredChannel = d.preferredChannel as ChannelId;

  const photoCount = typeof d.photosCount === "number" && d.photosCount > 0 ? Math.min(5, Math.floor(d.photosCount)) : 0;
  return Object.keys(o).length ? { patch: o, photoCount } : null;
}

export function Configurator() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [lead, setLead] = useState<LeadDevis>(createInitialLead);
  const [draftRestored, setDraftRestored] = useState(false);
  const [restoredPhotoCount, setRestoredPhotoCount] = useState(0);
  const fromRef = useRef("direct");
  const startedRef = useRef(false);
  const firstStepRef = useRef(true);

  // Pré-remplissage via paramètres d'URL (provenance fiches /marques/[slug] et
  // outils /outils/*). Lu une seule fois au mount, valeurs strictement validées
  // contre les enums ; toute valeur invalide est ignorée. L'utilisateur reste
  // libre de tout modifier ensuite. Aucun budget pré-rempli, aucun auto-skip.
  const searchParams = useSearchParams();
  useEffect(() => {
    if (!searchParams) return;
    const patch: Partial<LeadDevis> = {};

    const validBrands = new Set<string>([
      "aucune", "vaillant", "viessmann", "daikin", "mitsubishi",
      "buderus", "atlantic", "bosch", "de-dietrich", "hoval",
    ]);
    const marque = searchParams.get("marque")?.trim();
    if (marque && validBrands.has(marque)) patch.preferredBrand = marque as BrandPreferenceId;

    const serviceIds = new Set<string>(SERVICES.map((s) => s.id));
    const services = [
      ...(searchParams.get("service")?.split(",") ?? []),
      ...(searchParams.get("services")?.split(",") ?? []),
    ]
      .map((s) => s.trim())
      .filter((s) => serviceIds.has(s)) as ServiceId[];
    if (services.length) patch.services = Array.from(new Set(services));

    const surf = Number(searchParams.get("surface"));
    if (Number.isFinite(surf) && surf > 0) {
      patch.surface = Math.min(1000, Math.max(30, Math.round(surf)));
    }

    const commune = searchParams.get("commune")?.trim();
    if (commune && commune.length > 1) patch.commune = commune.slice(0, 120);

    const timelineIds = new Set<string>(TIMELINES.map((t) => t.id));
    const delai = (searchParams.get("delai") ?? searchParams.get("timeline"))?.trim();
    if (delai && timelineIds.has(delai)) patch.timeline = delai as TimelineId;

    const energyIds = new Set<string>(ENERGIES.map((e) => e.id));
    const energie = (searchParams.get("energie") ?? searchParams.get("currentEnergy"))?.trim();
    if (energie && energyIds.has(energie)) patch.currentEnergy = energie as EnergyId;

    const buildingIds = new Set<string>(BUILDINGS.map((b) => b.id));
    const batiment = (searchParams.get("batiment") ?? searchParams.get("buildingType"))?.trim();
    if (batiment && buildingIds.has(batiment)) patch.buildingType = batiment as BuildingId;

    // Brouillon local fusionné sous les params URL (URL outils > brouillon).
    const draft = loadDraft();
    const merged = { ...(draft?.patch ?? {}), ...patch };
    if (draft) {
      setDraftRestored(true);
      setRestoredPhotoCount(draft.photoCount);
    }
    if (Object.keys(merged).length) setLead((s) => ({ ...s, ...merged }));

    const rawFrom = searchParams.get("from")?.trim() ?? "";
    fromRef.current = /^[a-z0-9-]{1,40}$/.test(rawFrom) ? rawFrom : "direct";
    trackEvent("devis_arrived", { from: fromRef.current });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Étape atteinte (skip le rendu initial à l'étape 0 = déjà couvert par arrived).
  useEffect(() => {
    if (firstStepRef.current) {
      firstStepRef.current = false;
      return;
    }
    trackEvent("devis_step", { step, from: fromRef.current });
  }, [step]);

  // Sauvegarde auto du brouillon (debounce 600 ms ; jamais après envoi).
  useEffect(() => {
    if (sent) return;
    const t = setTimeout(() => saveDraft(lead), 600);
    return () => clearTimeout(t);
  }, [lead, sent]);

  const resetDraft = useCallback(() => {
    clearDraft();
    setDraftRestored(false);
    setRestoredPhotoCount(0);
    setStep(0);
    setLead(createInitialLead());
  }, []);

  const update = useCallback(<K extends keyof LeadDevis>(k: K, v: LeadDevis[K]) => {
    setLead((s) => ({ ...s, [k]: v }));
  }, []);

  const toggleService = useCallback((id: ServiceId) => {
    if (!startedRef.current) {
      startedRef.current = true;
      trackEvent("devis_started", { from: fromRef.current });
    }
    setLead((s) => ({
      ...s,
      services: s.services.includes(id) ? s.services.filter((x) => x !== id) : [...s.services, id],
    }));
  }, []);

  const canNext = useMemo(() => {
    switch (step) {
      case 0:
        return lead.services.length > 0;
      case 1:
        return !!lead.buildingType && !!lead.construction;
      case 2:
        return !!lead.currentEnergy && lead.commune.trim().length > 1;
      case 3:
        return !!lead.timeline && !!lead.budget;
      case 4:
        return !!lead.preferredBrand; // toujours rempli ("aucune" par défaut)
      case 5:
        return true; // photos optional
      case 6:
        return (
          lead.fullName.trim().length > 1 &&
          /.+@.+\..+/.test(lead.email) &&
          lead.phone.trim().length >= 6 &&
          !!lead.preferredChannel &&
          lead.rgpdConsent
        );
      default:
        return false;
    }
  }, [step, lead]);

  const next = useCallback(() => {
    if (!canNext) return;
    if (step < STEPS.length - 1) {
      setDirection(1);
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  }, [canNext, step]);

  const back = useCallback(() => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  }, [step]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setSubmitError(null);
    const apiPayload = {
      trap: honeypot,
      services: lead.services,
      buildingType: lead.buildingType,
      construction: lead.construction,
      surface: lead.surface,
      currentEnergy: lead.currentEnergy,
      commune: lead.commune,
      timeline: lead.timeline,
      budget: lead.budget,
      preferredBrand: lead.preferredBrand,
      photos: lead.photos,
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      preferredChannel: lead.preferredChannel,
      message: lead.message,
      rgpdConsent: lead.rgpdConsent,
      metadata: {
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        locale: typeof navigator !== "undefined" ? navigator.language : undefined,
        // Source d'acquisition capturée par <SourceTracker /> dans le layout
        source: (() => {
          try {
            if (typeof window === "undefined") return undefined;
            const raw = window.sessionStorage.getItem("ca-lead-source");
            return raw ? JSON.parse(raw) : undefined;
          } catch {
            return undefined;
          }
        })(),
      },
    };
    try {
      const res = await fetch("/api/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitError(
          data.error ??
            (res.status === 429
              ? "Trop de demandes envoyées récemment. Merci de réessayer dans une minute."
              : "Une erreur est survenue. Réessayez ou contactez-nous."),
        );
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      setLead((s) => ({
        ...s,
        reference: data.reference,
        submittedAt: data.submittedAt,
      }));
      setSent(true);
      clearDraft();
      trackEvent("devis_submitted", { from: fromRef.current });
    } catch (e) {
      setSubmitError("Connexion impossible. Vérifiez votre réseau puis réessayez.");
    } finally {
      setSubmitting(false);
    }
  }, [lead, honeypot]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (sent) return;
      if (e.key === "Enter" && e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === "TEXTAREA") return;
        if (canNext) next();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canNext, next, sent]);

  if (sent) {
    return <Success lead={lead} />;
  }

  return (
    <div className="min-h-[calc(100vh-200px)] py-10 lg:py-16">
      <div className="container max-w-4xl">
        {/* Honeypot anti-bot — invisible aux humains */}
        <div className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden>
          <label>
            Ne remplissez pas ce champ
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </label>
        </div>

        {draftRestored && !sent && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-copper/30 bg-copper/5 px-4 py-3 text-sm">
            <span className="text-graphite">
              Brouillon restauré — vos réponses ont été pré-remplies.
              {restoredPhotoCount > 0 &&
                ` (${restoredPhotoCount} photo${restoredPhotoCount > 1 ? "s" : ""} à réajouter.)`}
            </span>
            <button
              type="button"
              onClick={resetDraft}
              className="shrink-0 font-medium text-copper underline underline-offset-2 transition-colors hover:text-ember"
            >
              Recommencer à zéro
            </button>
          </div>
        )}

        <Progress current={step} />

        <div className="mt-10 lg:mt-14 min-h-[460px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: direction * 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -32 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 0 && <StepProject lead={lead} toggleService={toggleService} />}
              {step === 1 && <StepBuilding lead={lead} update={update} />}
              {step === 2 && <StepContext lead={lead} update={update} />}
              {step === 3 && <StepTimingBudget lead={lead} update={update} />}
              {step === 4 && <StepBrand lead={lead} update={update} />}
              {step === 5 && <StepPhotos lead={lead} update={update} />}
              {step === 6 && <StepContact lead={lead} update={update} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {submitError && (
          <div className="mt-6 p-4 rounded-xl border border-ember/40 bg-ember/8 text-sm text-ink">
            <strong className="text-ember">Envoi impossible.</strong> {submitError}
          </div>
        )}

        <Nav
          step={step}
          canNext={canNext && !submitting}
          submitting={submitting}
          onBack={back}
          onNext={next}
        />

        <Reassurance />
      </div>
    </div>
  );
}

/* ──────────────────────── PROGRESSION ──────────────────────── */

function Progress({ current }: { current: number }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 lg:gap-3">
        {STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={label} className="flex-1 flex items-center gap-1.5 lg:gap-2.5 min-w-0">
              <div
                className={cn(
                  "h-7 w-7 rounded-full grid place-items-center border transition-all shrink-0",
                  done && "bg-copper border-copper text-cream",
                  active && "bg-ink border-ink text-cream",
                  !done && !active && "border-ink/20 text-muted bg-white",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : <span className="font-mono text-xs">{i + 1}</span>}
              </div>
              <div
                className={cn(
                  "hidden md:block font-mono text-[10px] uppercase tracking-eyebrow truncate",
                  active ? "text-ink" : done ? "text-copper" : "text-muted",
                )}
              >
                {label}
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px bg-ink/12 mx-0.5 lg:mx-2 relative min-w-[12px]">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-copper"
                    initial={false}
                    animate={{ width: done ? "100%" : "0%" }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────── NAVIGATION BAS ──────────────────────── */

function Nav({
  step,
  canNext,
  submitting,
  onBack,
  onNext,
}: {
  step: number;
  canNext: boolean;
  submitting?: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  const isLastStep = step === STEPS.length - 1;
  return (
    <div className="mt-10 lg:mt-14 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 border-t border-ink/10 pt-8">
      <button
        onClick={onBack}
        disabled={step === 0}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-5 py-3 text-sm font-medium transition-all",
          step === 0 ? "opacity-30 cursor-not-allowed" : "hover:border-ink/40 hover:bg-white",
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>

      <div className="hidden md:block text-xs font-mono uppercase tracking-eyebrow text-muted">
        Étape {step + 1} / {STEPS.length}
      </div>

      <button
        onClick={onNext}
        disabled={!canNext}
        className={cn(
          "group inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-sm font-medium transition-all duration-300",
          canNext
            ? "bg-ink text-cream hover:bg-copper hover:-translate-y-0.5 shadow-card"
            : "bg-ink/15 text-ink/40 cursor-not-allowed",
        )}
      >
        {submitting ? "Envoi en cours…" : isLastStep ? "Envoyer ma demande" : "Continuer"}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}

function Reassurance() {
  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted">
      <span className="inline-flex items-center gap-1.5">
        <Lock className="h-3 w-3 text-copper" />
        Données confidentielles · aucun spam
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Info className="h-3 w-3 text-copper" />
        Aucun engagement
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Sparkles className="h-3 w-3 text-copper" />
        Étude personnalisée par notre bureau
      </span>
    </div>
  );
}

/* ──────────────────────── STEP 1 ─ PROJET ──────────────────────── */

function StepProject({
  lead,
  toggleService,
}: {
  lead: LeadDevis;
  toggleService: (id: ServiceId) => void;
}) {
  const count = lead.services.length;
  return (
    <div>
      <Header
        number="01"
        title={
          <>
            Quels sont vos <em className="not-italic text-copper">besoins</em> ?
          </>
        }
        intro="Vous pouvez sélectionner plusieurs services — utile pour les projets multi-lots (rénovation chauffage + sanitaire, transition énergétique PAC + solaire, etc.)."
      />

      <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
          Sélection multiple possible
        </div>
        <div
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-eyebrow border transition-colors",
            count > 0
              ? "bg-copper/10 border-copper/40 text-copper"
              : "border-ink/15 text-muted",
          )}
        >
          {count === 0
            ? "Aucun service sélectionné"
            : `${count} service${count > 1 ? "s" : ""} sélectionné${count > 1 ? "s" : ""}`}
        </div>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SERVICES.map((s) => (
          <BigCard
            key={s.id}
            selected={lead.services.includes(s.id)}
            onSelect={() => toggleService(s.id)}
            icon={<s.icon className="h-5 w-5" />}
            title={s.label}
            hint={s.hint}
          />
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────── STEP 2 ─ BÂTIMENT ──────────────────────── */

function StepBuilding({
  lead,
  update,
}: {
  lead: LeadDevis;
  update: <K extends keyof LeadDevis>(k: K, v: LeadDevis[K]) => void;
}) {
  return (
    <div>
      <Header
        number="02"
        title={
          <>
            Le <em className="not-italic text-copper">bâtiment</em>, et son contexte ?
          </>
        }
        intro="Deux questions essentielles pour notre bureau d'études."
      />

      <div className="mt-10 space-y-10">
        <div>
          <Label>Type de bâtiment</Label>
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {BUILDINGS.map((b) => (
              <BigCard
                key={b.id}
                selected={lead.buildingType === b.id}
                onSelect={() => update("buildingType", b.id)}
                icon={<b.icon className="h-5 w-5" />}
                title={b.label}
              />
            ))}
          </div>
        </div>

        <div>
          <Label>Neuf ou rénovation ?</Label>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            {CONSTRUCTIONS.map((c) => (
              <BigCard
                key={c.id}
                selected={lead.construction === c.id}
                onSelect={() => update("construction", c.id)}
                icon={<Hammer className="h-5 w-5" />}
                title={c.label}
                hint={c.hint}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────── STEP 3 ─ CONTEXTE TECHNIQUE ──────────────────────── */

function StepContext({
  lead,
  update,
}: {
  lead: LeadDevis;
  update: <K extends keyof LeadDevis>(k: K, v: LeadDevis[K]) => void;
}) {
  return (
    <div>
      <Header
        number="03"
        title={
          <>
            Caractéristiques <em className="not-italic text-copper">techniques</em>
          </>
        }
        intro="Trois informations qui changent tout : surface, énergie actuelle, commune."
      />

      <div className="mt-10 space-y-8">
        {/* Surface */}
        <div className="p-6 lg:p-8 rounded-2xl border border-ink/10 bg-white shadow-soft">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <Label className="!mb-0">Surface chauffée approximative</Label>
              <div className="mt-2 font-display text-3xl text-ink tabular-nums">
                {lead.surface} <span className="text-muted text-2xl">m²</span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                Catégorie
              </div>
              <div className="mt-1 text-sm text-graphite">
                {lead.surface < 100
                  ? "Petite surface"
                  : lead.surface < 200
                  ? "Maison standard"
                  : lead.surface < 400
                  ? "Grande maison"
                  : "Tertiaire / collectif"}
              </div>
            </div>
          </div>
          <input
            type="range"
            min={30}
            max={1000}
            step={10}
            value={lead.surface}
            onChange={(e) => update("surface", Number(e.target.value))}
            className="w-full accent-copper"
          />
          <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-eyebrow text-muted">
            <span>30 m²</span>
            <span>1000 m²+</span>
          </div>
        </div>

        {/* Energy */}
        <div>
          <Label>Énergie actuelle</Label>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ENERGIES.map((e) => (
              <Pill
                key={e.id}
                selected={lead.currentEnergy === e.id}
                onClick={() => update("currentEnergy", e.id)}
              >
                {e.label}
              </Pill>
            ))}
          </div>
        </div>

        {/* Commune */}
        <div>
          <Label>Commune au Luxembourg</Label>
          <input
            type="text"
            value={lead.commune}
            placeholder="Saisissez votre commune"
            onChange={(e) => update("commune", e.target.value)}
            className="mt-4 w-full bg-white border border-ink/12 rounded-xl px-4 py-3.5 text-ink focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20 transition-all"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-muted font-mono uppercase tracking-eyebrow">
              Souvent demandées :
            </span>
            {COMMUNE_SUGGESTIONS.map((c) => (
              <button
                key={c}
                onClick={() => update("commune", c)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs border transition-colors",
                  lead.commune === c
                    ? "bg-copper text-cream border-copper"
                    : "bg-white border-ink/12 text-graphite hover:border-copper/40",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────── STEP 4 ─ DÉLAI & BUDGET ──────────────────────── */

function StepTimingBudget({
  lead,
  update,
}: {
  lead: LeadDevis;
  update: <K extends keyof LeadDevis>(k: K, v: LeadDevis[K]) => void;
}) {
  return (
    <div>
      <Header
        number="04"
        title={
          <>
            <em className="not-italic text-copper">Délai</em> et budget indicatif
          </>
        }
        intro="Aucun engagement — c'est pour prioriser votre dossier et pré-orienter la proposition."
      />

      <div className="mt-10 space-y-10">
        <div>
          <Label>Délai souhaité</Label>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            {TIMELINES.map((t) => (
              <BigCard
                key={t.id}
                selected={lead.timeline === t.id}
                onSelect={() => update("timeline", t.id)}
                title={t.label}
                hint={t.hint}
                urgent={t.urgent}
              />
            ))}
          </div>
        </div>

        <div>
          <Label>Budget indicatif</Label>
          <p className="mt-2 text-sm text-graphite">
            Un ordre de grandeur — pas un engagement. Aide notre bureau d&apos;études à proposer
            la solution la plus pertinente.
          </p>
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {BUDGETS.map((b) => (
              <BigCard
                key={b.id}
                selected={lead.budget === b.id}
                onSelect={() => update("budget", b.id)}
                title={b.label}
                hint={b.hint}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────── STEP 5 ─ MARQUE SOUHAITÉE ──────────────────────── */

function StepBrand({
  lead,
  update,
}: {
  lead: LeadDevis;
  update: <K extends keyof LeadDevis>(k: K, v: LeadDevis[K]) => void;
}) {
  const selectedBrand =
    lead.preferredBrand && lead.preferredBrand !== "aucune"
      ? BRANDS[lead.preferredBrand]
      : null;

  // Smart matching marque ↔ budget : si l'utilisateur a déjà renseigné un
  // budget à l'étape 4 et qu'il y a un décalage avec la marque visée, on
  // affiche une suggestion soft sans imposer le choix.
  const budgetTier = budgetToTier(lead.budget);
  const fitVerdict = selectedBrand ? checkFit(budgetTier, selectedBrand) : "good";
  const fitMessage =
    selectedBrand && fitVerdict !== "good"
      ? getFitMessage(fitVerdict, budgetTier, selectedBrand)
      : null;
  const alternatives = selectedBrand ? suggestAlternatives(budgetTier, selectedBrand) : [];

  return (
    <div>
      <Header
        number="05"
        title={
          <>
            Une <em className="not-italic text-copper">marque</em> souhaitée ?
          </>
        }
        intro="Optionnel. Si vous avez déjà une marque en tête, indiquez-la. Sinon, nous comparons les options pertinentes pour votre projet."
      />

      {/* Récap si pré-sélection depuis fiche marque */}
      {selectedBrand && (
        <div className="mt-6 p-4 lg:p-5 rounded-2xl border border-copper/30 bg-copper/5 flex items-center gap-4">
          <span className="grid place-items-center h-10 w-10 rounded-full bg-copper/15 border border-copper/40 shrink-0">
            <Award className="h-5 w-5 text-copper" />
          </span>
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
              Pré-sélectionné · {selectedBrand.origin}
            </div>
            <div className="mt-1 font-display text-lg text-ink tracking-tight">
              {selectedBrand.name}
            </div>
            <div className="text-sm text-graphite truncate">{selectedBrand.shortPitch}</div>
          </div>
        </div>
      )}

      {/* Smart matching — suggestion alternative si budget/marque non aligné */}
      {fitMessage && alternatives.length > 0 && (
        <div className="mt-4 p-5 rounded-2xl border border-ember/30 bg-ember/5">
          <div className="flex items-start gap-3 mb-4">
            <span className="grid place-items-center h-9 w-9 rounded-full bg-ember/15 border border-ember/40 shrink-0">
              <Info className="h-4 w-4 text-ember" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-ember">
                Suggestion budget/marque
              </div>
              <p className="mt-1 text-sm text-ink leading-relaxed">{fitMessage}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-2 ml-12">
            {alternatives.map((alt) => (
              <button
                key={alt.slug}
                onClick={() => update("preferredBrand", alt.slug as typeof lead.preferredBrand)}
                className="text-left p-3 rounded-xl border border-ink/10 bg-white hover:border-copper/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-base text-ink tracking-tight">
                    {alt.name}
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-eyebrow text-copper bg-copper/10 border border-copper/30 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    {alt.priceTier === "accessible" ? "Accessible" : "Standard"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-graphite leading-snug line-clamp-2">
                  {alt.shortPitch}
                </p>
              </button>
            ))}
          </div>
          <p className="ml-12 mt-3 text-[11px] text-muted leading-relaxed">
            Vous gardez la main : ce sont des suggestions, pas une obligation.
          </p>
        </div>
      )}

      <div className="mt-8">
        <Label>Marque préférée</Label>
        <p className="mt-2 text-sm text-graphite">
          « Pas de préférence » est une réponse parfaitement valable — c&apos;est même la plus
          fréquente.
        </p>

        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BRAND_OPTIONS.map((b) => (
            <BigCard
              key={b.id}
              selected={lead.preferredBrand === b.id}
              onSelect={() => update("preferredBrand", b.id)}
              title={b.label}
              hint={b.hint}
              icon={b.id === "aucune" ? <Sparkles className="h-5 w-5" /> : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────── STEP 6 ─ PHOTOS ──────────────────────── */

function StepPhotos({
  lead,
  update,
}: {
  lead: LeadDevis;
  update: <K extends keyof LeadDevis>(k: K, v: LeadDevis[K]) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [isDragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      setError(null);
      const arr = Array.from(files);
      const validated: PhotoEntry[] = [];
      for (const file of arr) {
        if (!file.type.startsWith("image/")) {
          setError("Format non supporté — uniquement images (jpg, png, heic, webp).");
          continue;
        }
        if (file.size > MAX_PHOTO_SIZE) {
          setError(`Fichier trop volumineux (>8 Mo) : ${file.name}`);
          continue;
        }
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        validated.push({
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl,
        });
      }
      const combined = [...lead.photos, ...validated].slice(0, MAX_PHOTOS);
      if ([...lead.photos, ...validated].length > MAX_PHOTOS) {
        setError(`Maximum ${MAX_PHOTOS} photos.`);
      }
      update("photos", combined);
    },
    [lead.photos, update],
  );

  const removePhoto = useCallback(
    (idx: number) => {
      const next = lead.photos.filter((_, i) => i !== idx);
      update("photos", next);
    },
    [lead.photos, update],
  );

  return (
    <div>
      <Header
        number="05"
        title={
          <>
            Quelques photos —{" "}
            <em className="not-italic text-copper">elles accélèrent l&apos;étude</em>
          </>
        }
        intro="Optionnel mais très utile : chaufferie actuelle, emplacement extérieur, salle de bain à rénover, ou n'importe quel détail technique."
      />

      <div className="mt-10">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInput.current?.click()}
          className={cn(
            "relative cursor-pointer p-10 lg:p-14 rounded-3xl border-2 border-dashed text-center transition-all",
            isDragging
              ? "border-copper bg-copper/8"
              : "border-ink/15 bg-white hover:border-copper/50 hover:bg-cream",
          )}
        >
          <div className="mx-auto h-14 w-14 rounded-full bg-copper/10 border border-copper/30 grid place-items-center mb-4">
            <Upload className="h-6 w-6 text-copper" />
          </div>
          <div className="font-display text-2xl text-ink">
            Glissez vos photos ici
          </div>
          <div className="mt-2 text-sm text-graphite">
            ou cliquez pour parcourir · jusqu&apos;à {MAX_PHOTOS} photos · 8 Mo max chacune
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {error && (
          <div className="mt-3 text-xs text-ember bg-ember/8 border border-ember/30 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        {lead.photos.length > 0 && (
          <div className="mt-6 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {lead.photos.map((p, i) => (
              <div
                key={i}
                className="group relative aspect-square rounded-xl overflow-hidden border border-ink/10 bg-stone"
              >
                <img src={p.dataUrl} alt={p.name} className="w-full h-full object-cover" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhoto(i);
                  }}
                  className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-charcoal/80 backdrop-blur-md text-cream grid place-items-center hover:bg-ember transition-colors"
                  aria-label="Supprimer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-charcoal/70 text-cream text-[10px] truncate">
                  {(p.size / 1024).toFixed(0)} Ko
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-copper/5 border border-copper/20">
          <Camera className="h-5 w-5 text-copper shrink-0 mt-0.5" />
          <p className="text-sm text-graphite leading-relaxed">
            <strong className="text-ink">Astuce :</strong> photographiez votre chaudière, votre
            tableau électrique, l&apos;espace extérieur où installer une PAC, ou la pièce concernée.
            Plus c&apos;est concret, plus le devis est précis.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────── STEP 6 ─ CONTACT ──────────────────────── */

function StepContact({
  lead,
  update,
}: {
  lead: LeadDevis;
  update: <K extends keyof LeadDevis>(k: K, v: LeadDevis[K]) => void;
}) {
  return (
    <div>
      <Header
        number="06"
        title={
          <>
            Et enfin —{" "}
            <em className="not-italic text-copper">comment vous joindre</em>
          </>
        }
        intro="Vos coordonnées restent strictement confidentielles."
      />

      <div className="mt-10 grid lg:grid-cols-2 gap-10">
        <div className="space-y-5">
          <Field
            label="Nom complet"
            required
            value={lead.fullName}
            onChange={(v) => update("fullName", v)}
          />
          <Field
            label="Email"
            type="email"
            required
            value={lead.email}
            onChange={(v) => update("email", v)}
          />
          <Field
            label="Téléphone"
            type="tel"
            required
            value={lead.phone}
            onChange={(v) => update("phone", v)}
          />

          <div>
            <Label>Préférence de contact</Label>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {CHANNELS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => update("preferredChannel", c.id)}
                  className={cn(
                    "p-3 rounded-xl border text-sm transition-all inline-flex items-center gap-2 justify-center",
                    lead.preferredChannel === c.id
                      ? "bg-ink text-cream border-ink"
                      : "bg-white border-ink/12 text-graphite hover:border-copper/40",
                  )}
                >
                  <c.icon className="h-4 w-4" />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Précisions (optionnel)</Label>
            <textarea
              rows={4}
              value={lead.message}
              placeholder="Contraintes, attentes, questions, préférences de marque, créneaux préférés…"
              onChange={(e) => update("message", e.target.value)}
              className="mt-3 w-full bg-white border border-ink/12 rounded-xl px-4 py-3.5 text-ink focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20 transition-all resize-none"
            />
          </div>

          <label className="flex items-start gap-3 text-xs text-graphite">
            <input
              type="checkbox"
              checked={lead.rgpdConsent}
              onChange={(e) => update("rgpdConsent", e.target.checked)}
              className="mt-0.5 accent-copper"
            />
            <span>
              J&apos;accepte que mes données soient utilisées pour traiter ma demande de devis,
              conformément au <strong>RGPD</strong> (Luxembourg). Aucune revente, aucune
              communication à un tiers. Je peux demander la suppression à tout moment.
            </span>
          </label>
        </div>

        <div className="hidden lg:block">
          <Summary lead={lead} />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────── SUCCESS SCREEN ──────────────────────── */

function Success({ lead }: { lead: LeadDevis }) {
  const firstName = lead.fullName.trim().split(" ")[0] || "vous";

  // Libellés humains
  const servicesLabel = lead.services
    .map((id) => SERVICES.find((s) => s.id === id)?.label)
    .filter(Boolean)
    .join(" · ");
  const buildingLabel = BUILDINGS.find((b) => b.id === lead.buildingType)?.label ?? "—";
  const constructionLabel = CONSTRUCTIONS.find((c) => c.id === lead.construction)?.label ?? "—";
  const energyLabel = ENERGIES.find((e) => e.id === lead.currentEnergy)?.label ?? "—";
  const timelineLabel = TIMELINES.find((t) => t.id === lead.timeline)?.label ?? "—";
  const budgetLabel = BUDGETS.find((b) => b.id === lead.budget)?.label ?? "—";
  const channelLabel = CHANNELS.find((c) => c.id === lead.preferredChannel)?.label ?? "—";

  const submittedDate = lead.submittedAt
    ? new Date(lead.submittedAt).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";
  const submittedTime = lead.submittedAt
    ? new Date(lead.submittedAt).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="min-h-[60vh] py-16">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="container max-w-3xl"
      >
        {/* En-tête merci */}
        <div className="text-center">
          <div className="inline-grid place-items-center h-20 w-20 rounded-full bg-copper/15 border border-copper/40 mb-8">
            <CheckCircle2 className="h-9 w-9 text-copper" />
          </div>

          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
            Dossier · {lead.reference}
          </div>

          <h1 className="mt-5 font-display text-display-lg text-ink text-balance">
            Merci {firstName}.{" "}
            <em className="not-italic text-copper">
              Nous analysons votre projet avant de vous recontacter.
            </em>
          </h1>

          <p className="mt-6 text-lg text-graphite max-w-xl mx-auto text-balance">
            Votre demande a été reçue et transmise à notre bureau d&apos;études. Un membre de
            l&apos;équipe revient vers vous via votre canal préféré pour échanger sur le projet
            et, si pertinent, fixer une visite technique.
          </p>

          <div className="mt-10 grid sm:grid-cols-3 gap-4 text-left">
            <StepNext n="01" t="Analyse" b="Votre dossier est étudié par notre bureau" />
            <StepNext
              n="02"
              t="Reprise de contact"
              b={`Via ${labelChannel(lead.preferredChannel)}`}
            />
            <StepNext n="03" t="Étude personnalisée" b="Si pertinent, visite et devis détaillé" />
          </div>

          <div className="mt-10 inline-flex items-center gap-2 text-xs text-muted font-mono uppercase tracking-eyebrow">
            <Lock className="h-3 w-3 text-copper" />
            Vos données sont stockées de manière confidentielle · RGPD Luxembourg
          </div>
        </div>

        {/* Récap lisible — fiche projet */}
        <div className="mt-14 text-left">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
              Récapitulatif de votre demande
            </div>
            {submittedDate && (
              <div className="text-xs text-muted">
                Envoyée le {submittedDate} à {submittedTime}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-ink/10 bg-white shadow-soft overflow-hidden">
            {/* Bloc projet */}
            <div className="p-6 lg:p-8">
              <div className="font-display text-xl text-ink mb-5">Votre projet</div>
              <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
                <RecapRow
                  k={lead.services.length > 1 ? "Services demandés" : "Service demandé"}
                  v={servicesLabel}
                  accent
                />
                <RecapRow k="Type de bâtiment" v={buildingLabel} />
                <RecapRow k="Nature des travaux" v={constructionLabel} />
                <RecapRow k="Surface concernée" v={`${lead.surface} m²`} />
                <RecapRow k="Énergie actuelle" v={energyLabel} />
                <RecapRow k="Commune" v={lead.commune} />
                <RecapRow
                  k="Délai souhaité"
                  v={timelineLabel}
                  accent={lead.timeline === "urgent"}
                  accentColor={lead.timeline === "urgent" ? "ember" : undefined}
                />
                <RecapRow k="Budget indicatif" v={budgetLabel} />
                <RecapRow
                  k="Marque souhaitée"
                  v={
                    lead.preferredBrand && lead.preferredBrand !== "aucune"
                      ? BRANDS[lead.preferredBrand]?.name ?? "—"
                      : "Pas de préférence"
                  }
                  accent={lead.preferredBrand !== "aucune"}
                />
              </dl>

              {lead.message && (
                <div className="mt-7 pt-6 border-t border-ink/8">
                  <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-3">
                    Précisions transmises
                  </div>
                  <p className="text-sm text-graphite leading-relaxed whitespace-pre-wrap italic">
                    « {lead.message} »
                  </p>
                </div>
              )}
            </div>

            {/* Photos jointes */}
            {lead.photos.length > 0 && (
              <div className="border-t border-ink/8 bg-cream/40 p-6 lg:p-8">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-4">
                  {lead.photos.length} photo{lead.photos.length > 1 ? "s" : ""} jointe
                  {lead.photos.length > 1 ? "s" : ""}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                  {lead.photos.map((p, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-xl overflow-hidden border border-ink/10 bg-stone"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.dataUrl}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bloc contact */}
            <div className="border-t border-ink/8 p-6 lg:p-8 bg-linen/50">
              <div className="font-display text-xl text-ink mb-5">Vos coordonnées</div>
              <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
                <RecapRow k="Nom complet" v={lead.fullName} />
                <RecapRow k="Email" v={lead.email} />
                <RecapRow k="Téléphone" v={lead.phone} />
                <RecapRow k="Vous recontacter par" v={channelLabel} accent />
              </dl>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted">
            Cette fiche reprend exactement les informations qui ont été transmises à notre
            équipe. Une copie vous a également été envoyée par email.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function RecapRow({
  k,
  v,
  accent,
  accentColor,
}: {
  k: string;
  v: string;
  accent?: boolean;
  accentColor?: "copper" | "ember";
}) {
  const color = accentColor === "ember" ? "text-ember" : "text-copper";
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-1.5">{k}</dt>
      <dd
        className={cn(
          "font-medium leading-snug",
          accent ? color : "text-ink",
        )}
      >
        {v}
      </dd>
    </div>
  );
}

function StepNext({ n, t, b }: { n: string; t: string; b: string }) {
  return (
    <div className="p-5 rounded-2xl border border-ink/10 bg-white text-left">
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">{n}</div>
      <div className="mt-2 font-display text-xl text-ink">{t}</div>
      <div className="text-sm text-graphite mt-1">{b}</div>
    </div>
  );
}

function labelChannel(c?: ChannelId) {
  if (!c) return "votre canal préféré";
  return CHANNELS.find((x) => x.id === c)?.label.toLowerCase() ?? "votre canal préféré";
}

/* ──────────────────────── HELPERS UI ──────────────────────── */

function Header({
  number,
  title,
  intro,
}: {
  number: string;
  title: React.ReactNode;
  intro: string;
}) {
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-eyebrow text-copper">
        {number} — Configurateur
      </div>
      <h1 className="mt-4 font-display text-display-lg text-ink text-balance">{title}</h1>
      <p className="mt-4 text-lg text-graphite max-w-2xl text-balance">{intro}</p>
    </div>
  );
}

function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

function BigCard({
  selected,
  onSelect,
  icon,
  title,
  hint,
  urgent,
}: {
  selected: boolean;
  onSelect: () => void;
  icon?: React.ReactNode;
  title: string;
  hint?: string;
  urgent?: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative text-left p-5 lg:p-6 rounded-2xl border bg-white transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-lift",
        selected
          ? "border-copper bg-copper/5 shadow-card ring-2 ring-copper/20"
          : urgent
          ? "border-ember/30 hover:border-ember/60"
          : "border-ink/10 hover:border-copper/40",
      )}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <span
            className={cn(
              "grid place-items-center h-10 w-10 rounded-full border shrink-0 transition-colors",
              selected
                ? "bg-copper text-cream border-copper"
                : urgent
                ? "bg-ember/10 text-ember border-ember/40"
                : "bg-cream text-copper border-copper/30",
            )}
          >
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg text-ink leading-tight">{title}</div>
          {hint && <div className="mt-1 text-sm text-muted">{hint}</div>}
        </div>
        <span
          className={cn(
            "h-5 w-5 rounded-full border shrink-0 transition-all grid place-items-center",
            selected ? "bg-copper border-copper" : "border-ink/20",
          )}
        >
          {selected && <Check className="h-3 w-3 text-cream" />}
        </span>
      </div>
    </button>
  );
}

function Pill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-3 rounded-xl text-sm transition-all text-left border",
        selected
          ? "bg-ink text-cream border-ink"
          : "bg-white border-ink/10 text-ink hover:border-copper/40 hover:bg-cream",
      )}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  type = "text",
  required,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  type?: string;
  required?: boolean;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  const inputMode: React.HTMLAttributes<HTMLInputElement>["inputMode"] =
    type === "email" ? "email" : type === "tel" ? "tel" : "text";
  const autoComplete =
    type === "email"
      ? "email"
      : type === "tel"
      ? "tel"
      : label.toLowerCase().includes("nom")
      ? "name"
      : undefined;
  return (
    <div>
      <Label>
        {label}
        {required && <span className="text-copper ml-1">*</span>}
      </Label>
      <input
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-white border border-ink/12 rounded-xl px-4 py-3.5 text-ink focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20 transition-all"
      />
    </div>
  );
}

function Summary({ lead }: { lead: LeadDevis }) {
  const servicesLabel =
    lead.services.length === 0
      ? undefined
      : lead.services.map((id) => SERVICES.find((s) => s.id === id)?.label).filter(Boolean).join(" · ");
  // Label marque souhaitée — "Pas de préférence" si "aucune", sinon le nom commercial.
  const brandLabel =
    lead.preferredBrand && lead.preferredBrand !== "aucune"
      ? BRANDS[lead.preferredBrand]?.name
      : "Pas de préférence";
  const rows = [
    { k: "Services", v: servicesLabel },
    { k: "Bâtiment", v: BUILDINGS.find((b) => b.id === lead.buildingType)?.label },
    { k: "Type", v: CONSTRUCTIONS.find((c) => c.id === lead.construction)?.label },
    { k: "Surface", v: `${lead.surface} m²` },
    { k: "Énergie actuelle", v: ENERGIES.find((e) => e.id === lead.currentEnergy)?.label },
    { k: "Commune", v: lead.commune },
    { k: "Délai", v: TIMELINES.find((t) => t.id === lead.timeline)?.label },
    { k: "Budget", v: BUDGETS.find((b) => b.id === lead.budget)?.label },
    { k: "Marque souhaitée", v: brandLabel },
    { k: "Photos", v: `${lead.photos.length} jointe${lead.photos.length > 1 ? "s" : ""}` },
  ];
  return (
    <div className="p-6 rounded-2xl bg-cream border border-ink/10 sticky top-32">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
        <Sparkles className="h-3 w-3" />
        Récap de votre projet
      </div>
      <div className="mt-5 grid gap-2.5">
        {rows.map((r) => (
          <div
            key={r.k}
            className="flex items-start justify-between gap-4 py-2 border-b border-ink/8 last:border-0"
          >
            <span className="text-xs text-muted font-mono uppercase tracking-eyebrow">{r.k}</span>
            <span className="text-sm font-medium text-ink text-right">{r.v ?? "—"}</span>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs text-muted leading-relaxed">
        Référence dossier <strong className="text-ink">{lead.reference}</strong> · attribuée à
        votre demande pour suivi interne.
      </p>
    </div>
  );
}
