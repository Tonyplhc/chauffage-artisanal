"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, Check, X } from "lucide-react";
import {
  estimerProjet,
  COMMUNES_LU,
  type EstimationResult,
  type ChauffageActuel,
  type Logement,
} from "@/lib/referentiel/estimation";

/**
 * Estimateur immersif (production). Charte Règle N°4 : tous les chiffres viennent
 * du moteur déterministe `estimerProjet` (lib/referentiel) — jamais de l'UI.
 * Sémaphore financier : 🟢 gain · 🔴 coût · ⚫ neutre.
 */

type Step =
  | "hero" | "commune" | "logement" | "chauffage" | "facture"
  | "loading" | "result" | "capture" | "confirm";

type Timeline = "urgent" | "court" | "annee" | "exploration";

const PROGRESS: Partial<Record<Step, number>> = {
  commune: 1, logement: 2, chauffage: 3, facture: 4,
  loading: 4, result: 4, capture: 4, confirm: 4,
};

const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR");

export interface EstimateurProps {
  /** Pré-remplissage depuis le hero (lancement direct). */
  initialCommune?: string;
  initialChauffage?: ChauffageActuel;
  /** Écran de départ (ex. "logement" si commune + chauffage déjà fournis). */
  initialStep?: Step;
}

export function Estimateur({ initialCommune, initialChauffage, initialStep }: EstimateurProps = {}) {
  const [step, setStep] = useState<Step>(initialStep ?? "hero");
  const [commune, setCommune] = useState(initialCommune ?? "Luxembourg");
  const [logement, setLogement] = useState<Logement>("maison");
  const [chauffage, setChauffage] = useState<ChauffageActuel>(initialChauffage ?? "Mazout");
  const [facture, setFacture] = useState(3200);
  const [result, setResult] = useState<EstimationResult | null>(null);
  const [gainShown, setGainShown] = useState(0);
  const [modal, setModal] = useState(false);
  // Deep-link hero : commune + chauffage déjà fournis → on saute l'étape chauffage.
  const [skipChauffage, setSkipChauffage] = useState(Boolean(initialChauffage && initialStep === "logement"));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Formulaire de capture → lead scoré (POST /api/devis, même pipeline que /devis).
  const [form, setForm] = useState({
    nom: "", email: "", tel: "",
    timeline: "court" as Timeline,
    rappel: "Indifférent",
    rgpd: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  // RDV visite technique (optionnel, post-capture) — créneaux réels /api/bookings.
  type Slot = { iso: string; date: string; time: string };
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotDay, setSlotDay] = useState<string | null>(null);
  const [bookedSlot, setBookedSlot] = useState<Slot | null>(null);
  const [bookingBusy, setBookingBusy] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    if (step !== "confirm" || bookedSlot) return;
    let cancelled = false;
    fetch("/api/bookings")
      .then((r) => (r.ok ? r.json() : { slots: [] }))
      .then((d) => { if (!cancelled) setSlots(d.slots ?? []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [step, bookedSlot]);

  async function bookSlot(slot: Slot) {
    if (bookingBusy) return;
    setBookingBusy(true);
    setBookingError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotIso: slot.iso,
          purpose: "visite-technique",
          fullName: form.nom.trim(),
          email: form.email.trim(),
          phone: form.tel.trim(),
          commune: commune === "Autre" ? "Autre commune" : commune,
          notes: reference ? `Visite technique suite à l'estimation en ligne (réf. ${reference}).` : "Visite technique suite à l'estimation en ligne.",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBookingError(data.error ?? "Créneau indisponible. Choisissez-en un autre.");
        // Rafraîchit la grille (le créneau vient peut-être d'être pris).
        fetch("/api/bookings").then((r) => r.json()).then((d) => setSlots(d.slots ?? [])).catch(() => {});
        return;
      }
      setBookedSlot(slot);
    } catch {
      setBookingError("Connexion impossible. Réessayez.");
    } finally {
      setBookingBusy(false);
    }
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    if (!result || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildLeadPayload({ result, commune, logement, chauffage, facture, form })),
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
      setReference(data.reference ?? null);
      setStep("confirm");
    } catch {
      setSubmitError("Connexion impossible. Vérifiez votre réseau puis réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  // Lancement de l'analyse → calcul déterministe après un court suspense.
  function lancer() {
    setStep("loading");
    timer.current = setTimeout(() => {
      setResult(estimerProjet({ commune, logement, chauffage, factureAnnuelle: facture }));
      setStep("result");
    }, 1300);
  }
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // Compteur animé du gain 10 ans à la révélation.
  useEffect(() => {
    if (step !== "result" || !result) return;
    const to = result.gain10ans;
    const dur = 1400;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - t0) / dur, 1);
      setGainShown(Math.floor(p * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step, result]);

  function restart() {
    setStep("hero"); setResult(null); setGainShown(0);
    setSkipChauffage(false);
    setSubmitError(null); setReference(null);
    setSlots([]); setSlotDay(null); setBookedSlot(null); setBookingError(null);
    setForm({ nom: "", email: "", tel: "", timeline: "court", rappel: "Indifférent", rgpd: false });
  }

  const pct = PROGRESS[step] != null ? (PROGRESS[step]! / 4) * 100 : 0;

  return (
    <div className="min-h-screen flex flex-col bg-creme font-ui text-anthra">
      {/* Progression */}
      {step !== "hero" && (
        <div className="sticky top-0 z-10 bg-creme/90 backdrop-blur border-b border-pierre">
          <div className="max-w-3xl mx-auto px-5 h-14 flex items-center gap-4">
            <span className="font-display text-sm tracking-tightest text-anthra shrink-0 hidden sm:block">
              Chauffage Artisanal
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-pierre overflow-hidden">
              <div className="h-full bg-bleu transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <button onClick={restart} className="text-xs text-muted hover:text-anthra shrink-0">Recommencer</button>
          </div>
        </div>
      )}

      <main className="flex-1">
        {/* HERO */}
        {step === "hero" && (
          <section className="relative overflow-hidden">
            <Image
              src="https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&w=1600"
              alt="" fill priority sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(105deg,#F7F2E9 0%,#F7F2E9 46%,rgba(247,242,233,.7) 60%,rgba(247,242,233,.1) 100%)" }} />
            <div className="relative max-w-6xl mx-auto px-5 py-16 lg:py-24">
              <div className="max-w-xl">
                <div className="font-mono text-[11px] uppercase tracking-eyebrow text-bleu">Estimation gratuite · 60 secondes</div>
                <h1 className="mt-5 font-display text-[2.6rem] sm:text-6xl leading-[1.02] tracking-tightest text-anthra">
                  Vous chauffez au <span className="text-perte">mazout</span> ? Voyez ce que vous <span className="text-gain">récupérez</span>.
                </h1>
                <p className="mt-6 text-lg text-taupe max-w-md">
                  En 60 secondes, découvrez votre économie, vos aides et votre gain sur 10 ans en passant à une pompe à chaleur — sur votre vraie facture.
                </p>
                <button onClick={() => setStep("commune")} className="mt-8 group inline-flex items-center justify-center gap-2 rounded-full bg-bleu text-creme px-8 py-4 text-base font-semibold hover:bg-navy transition shadow-lg shadow-navy/20">
                  Démarrer mon estimation <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted"><span>✓ Gratuit</span><span>✓ Sans engagement</span><span>✓ Aides comprises</span></div>
              </div>
            </div>
          </section>
        )}

        {/* COMMUNE */}
        {step === "commune" && (
          <Stepwrap n="1" titre="Où se situe votre logement ?" sous="On vérifie les aides disponibles dans votre commune.">
            <select value={commune} onChange={(e) => setCommune(e.target.value)} className="mt-8 w-full rounded-2xl border border-pierre bg-white px-5 py-4 text-lg text-anthra focus:border-bleu outline-none">
              {COMMUNES_LU.map((c) => (
                <option key={c} value={c}>{c === "Luxembourg" ? "Luxembourg-Ville" : c === "Autre" ? "Autre commune" : c}</option>
              ))}
            </select>
            <button onClick={() => setStep("logement")} className="mt-8 inline-flex items-center gap-2 rounded-full bg-bleu text-creme px-7 py-3.5 text-sm font-semibold hover:bg-navy transition">Continuer <ArrowRight className="h-4 w-4" /></button>
          </Stepwrap>
        )}

        {/* LOGEMENT */}
        {step === "logement" && (
          <Stepwrap n="2" titre="Votre logement, c'est…" sous="Le montant exact des aides Klimabonus en dépend.">
            <div className="mt-8 grid sm:grid-cols-2 gap-3">
              <Choice title="Maison" sub="Logement unifamilial" onClick={() => { setLogement("maison"); setStep(skipChauffage ? "facture" : "chauffage"); }} />
              <Choice title="Appartement" sub="Logement collectif" onClick={() => { setLogement("appartement"); setStep(skipChauffage ? "facture" : "chauffage"); }} />
            </div>
          </Stepwrap>
        )}

        {/* CHAUFFAGE */}
        {step === "chauffage" && (
          <Stepwrap n="3" titre="Comment vous chauffez-vous aujourd'hui ?">
            <div className="mt-8 grid sm:grid-cols-2 gap-3">
              <Choice title="Mazout" sub="Chaudière fioul" onClick={() => { setChauffage("Mazout"); setStep("facture"); }} />
              <Choice title="Gaz" sub="Chaudière gaz naturel" onClick={() => { setChauffage("Gaz"); setStep("facture"); }} />
              <Choice title="Électrique" sub="Convecteurs / accumulateurs" onClick={() => { setChauffage("Électrique"); setStep("facture"); }} />
              <Choice title="Bois" sub="Bûches ou pellets" onClick={() => { setChauffage("Bois"); setStep("facture"); }} />
              <Choice title="Autre" sub="Pompe à chaleur, réseau de chaleur…" onClick={() => { setChauffage("Autre"); setStep("facture"); }} />
            </div>
          </Stepwrap>
        )}

        {/* FACTURE */}
        {step === "facture" && (
          <Stepwrap n="4" titre="Votre facture de chauffage par an ?" sous="Une estimation suffit — glissez le curseur.">
            <div className="mt-10 text-center">
              <span className="font-display text-6xl lg:text-7xl tracking-tightest text-perte">{fmt(facture)}</span>
              <span className="font-display text-3xl text-perte/70"> €/an</span>
              <div className="text-xs text-muted mt-1">🔴 ce que vous payez aujourd'hui</div>
            </div>
            <input type="range" min={800} max={6000} step={100} value={facture} onChange={(e) => setFacture(+e.target.value)} className="mt-8 w-full accent-bleu" />
            <div className="flex justify-between text-xs text-muted mt-2"><span>800 €</span><span>6 000 €</span></div>
            <button onClick={lancer} className="mt-10 w-full inline-flex items-center justify-center gap-2 rounded-full bg-bleu text-creme px-7 py-4 text-base font-semibold hover:bg-navy transition shadow-lg shadow-navy/20">Voir mon potentiel <ArrowRight className="h-5 w-5" /></button>
          </Stepwrap>
        )}

        {/* LOADING */}
        {step === "loading" && (
          <div className="max-w-2xl mx-auto px-5 py-28 text-center">
            <div className="inline-block h-12 w-12 rounded-full border-4 border-pierre border-t-bleu animate-spin" />
            <div className="mt-6 font-display text-2xl text-anthra">Nous analysons votre potentiel…</div>
            <div className="mt-2 text-sm text-taupe">Consommation · aides Luxembourg · dimensionnement</div>
          </div>
        )}

        {/* RESULT */}
        {step === "result" && result && (
          <div className="max-w-3xl mx-auto px-5 py-12 lg:py-16">
            <div className="text-center">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-taupe">Votre projet recommandé</div>
              <h2 className="mt-2 font-display text-3xl lg:text-4xl tracking-tightest text-anthra">{result.equipement}</h2>
            </div>

            <div className="mt-7 rounded-[28px] bg-gainBg border border-gain/20 px-8 py-10 text-center">
              <div className="font-mono text-[11px] uppercase tracking-eyebrow text-gain">Vous gagnez sur 10 ans</div>
              <div className="mt-2 flex items-start justify-center gap-2">
                <span className="font-display text-3xl text-gain mt-3">+</span>
                <span className="font-display text-[5rem] lg:text-[7.5rem] leading-[0.85] tracking-tightest text-gain">{fmt(gainShown)}</span>
                <span className="font-display text-4xl text-gain mt-4">€</span>
              </div>
              <div className="mt-2 text-sm text-gain/70">en passant à la pompe à chaleur</div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white border border-pierre p-4 text-center">
                <div className="font-mono text-[9px] uppercase tracking-eyebrow text-muted">Économie / an</div>
                <div className="mt-1.5 font-display text-2xl lg:text-3xl text-gain tracking-tight">+{fmt(result.economieAnnuelle)} €</div>
              </div>
              <button onClick={() => setModal(true)} className="rounded-2xl bg-white border border-pierre p-4 text-center hover:border-gain/40 hover:shadow-lg transition group">
                <div className="font-mono text-[9px] uppercase tracking-eyebrow text-muted">Aides possibles</div>
                <div className="mt-1.5 font-display text-2xl lg:text-3xl text-gain tracking-tight">+{fmt(result.aides.klimabonus)} €</div>
                <div className="mt-1 text-[10px] text-gain/80 group-hover:text-gain underline underline-offset-2">voir le détail →</div>
              </button>
              <div className="rounded-2xl bg-white border border-pierre p-4 text-center">
                <div className="font-mono text-[9px] uppercase tracking-eyebrow text-muted">Reste à charge</div>
                <div className="mt-1.5 font-display text-2xl lg:text-3xl text-anthra tracking-tight">{fmt(result.resteACharge)} €</div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-perte" />
              <span className="text-taupe">Aujourd'hui, <strong className="text-perte font-semibold">{fmt(result.coutActuel)} €/an</strong> {phraseEnergie(chauffage)}.</span>
            </div>
            <div className="mt-1 text-center text-xs text-muted">
              Retour sur investissement ≈ {result.roiAnnees != null ? String(result.roiAnnees).replace(".", ",") : "—"} ans · + aides communales possibles à {commune === "Autre" ? "votre commune" : commune}
            </div>

            {/* Preuve + réduction du risque avant l'action (Règle N°7) — signaux réels uniquement */}
            <div className="mt-7 grid sm:grid-cols-3 gap-2.5">
              <div className="rounded-xl bg-white border border-pierre px-4 py-3 flex items-center gap-2.5">
                <Check className="h-4 w-4 text-bleu shrink-0" />
                <span className="text-xs text-taupe">Maison luxembourgeoise <strong className="text-anthra">depuis 1994</strong> (RCS B46877)</span>
              </div>
              <div className="rounded-xl bg-white border border-pierre px-4 py-3 flex items-center gap-2.5">
                <Check className="h-4 w-4 text-bleu shrink-0" />
                <span className="text-xs text-taupe">Partenaires agréés <strong className="text-anthra">Viessmann · Buderus · De Dietrich</strong></span>
              </div>
              <div className="rounded-xl bg-white border border-pierre px-4 py-3 flex items-center gap-2.5">
                <Check className="h-4 w-4 text-bleu shrink-0" />
                <span className="text-xs text-taupe">Étude <strong className="text-anthra">gratuite et sans engagement</strong> — vous restez libre</span>
              </div>
            </div>

            <div className="mt-5">
              <button onClick={() => setStep("capture")} className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-bleu text-creme px-7 py-4 text-base font-semibold hover:bg-navy transition shadow-lg shadow-navy/20">Recevoir mon étude gratuite <ArrowRight className="h-5 w-5" /></button>
              <div className="mt-3 text-center text-[11px] text-muted/90">Forfaits Klimabonus 2026 vérifiés sur guichet.public.lu · prix énergie LU · SCOP 3,5. Aide soumise à un système basse température (≤ 35 °C) et à un accord de principe avant devis — montant exact confirmé lors de l'étude.</div>
            </div>
            <div className="mt-5 flex items-center justify-center gap-5">
              <button onClick={restart} className="text-xs text-muted hover:text-anthra underline underline-offset-2">← Recommencer l&apos;estimation</button>
              <a href="/assistant" className="text-xs text-bleu hover:text-navy underline underline-offset-2">Des questions ? Parlez à notre assistant →</a>
            </div>
          </div>
        )}

        {/* CAPTURE */}
        {step === "capture" && result && (
          <div className="max-w-xl mx-auto px-5 py-12 lg:py-16">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu">Dernière étape</div>
            <h2 className="mt-3 font-display text-4xl lg:text-5xl tracking-tightest text-anthra">Recevez votre étude gratuite.</h2>
            <p className="mt-3 text-taupe">Un technicien valide votre estimation et chiffre votre projet — gratuitement, sans engagement.</p>

            <div className="mt-6 rounded-2xl bg-gainBg border border-gain/20 p-4 flex items-center justify-between gap-3">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-eyebrow text-gain">Votre estimation est conservée</div>
                <div className="mt-0.5 text-sm text-gain">Gain 10 ans <strong>+{fmt(result.gain10ans)} €</strong> · économie <strong>+{fmt(result.economieAnnuelle)} €/an</strong></div>
              </div>
              <Check className="h-7 w-7 text-gain shrink-0" />
            </div>

            <form className="mt-6 space-y-3" onSubmit={submitLead}>
              <input required value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} className="w-full rounded-2xl border border-pierre bg-white px-5 py-3.5 text-anthra focus:border-bleu outline-none" placeholder="Prénom et nom" autoComplete="name" />
              <div className="grid sm:grid-cols-2 gap-3">
                <input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full rounded-2xl border border-pierre bg-white px-5 py-3.5 text-anthra focus:border-bleu outline-none" placeholder="Email" autoComplete="email" />
                <input required type="tel" value={form.tel} onChange={(e) => setForm((f) => ({ ...f, tel: e.target.value }))} className="w-full rounded-2xl border border-pierre bg-white px-5 py-3.5 text-anthra focus:border-bleu outline-none" placeholder="Téléphone" autoComplete="tel" />
              </div>
              <div>
                <div className="text-xs text-taupe mb-1.5 ml-1">Votre projet, c&apos;est pour…</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {([
                    { v: "urgent", l: "Au plus vite" },
                    { v: "court", l: "< 3 mois" },
                    { v: "annee", l: "Cette année" },
                    { v: "exploration", l: "Je me renseigne" },
                  ] as { v: Timeline; l: string }[]).map((o) => (
                    <button type="button" key={o.v} onClick={() => setForm((f) => ({ ...f, timeline: o.v }))}
                      className={`rounded-xl border px-2 py-2.5 text-xs font-medium transition ${form.timeline === o.v ? "border-bleu bg-voile text-bleu" : "border-pierre bg-white text-taupe hover:border-bleu/50"}`}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
              <select value={form.rappel} onChange={(e) => setForm((f) => ({ ...f, rappel: e.target.value }))} className="w-full rounded-2xl border border-pierre bg-white px-5 py-3.5 text-anthra focus:border-bleu outline-none">
                <option value="Indifférent">Quand vous rappeler ? — Indifférent</option>
                <option value="Plutôt le matin">Plutôt le matin</option>
                <option value="Plutôt l'après-midi">Plutôt l&apos;après-midi</option>
                <option value="En soirée">En soirée</option>
              </select>
              <label className="flex items-start gap-2 text-xs text-taupe"><input required type="checkbox" checked={form.rgpd} onChange={(e) => setForm((f) => ({ ...f, rgpd: e.target.checked }))} className="mt-0.5" /> J&apos;accepte d&apos;être recontacté par Chauffage Artisanal au sujet de mon projet (RGPD).</label>
              {submitError && <div className="rounded-xl bg-perteBg border border-perte/20 px-4 py-3 text-sm text-perte">{submitError}</div>}
              <button type="submit" disabled={submitting} className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-full bg-bleu text-creme px-7 py-4 text-base font-semibold hover:bg-navy transition shadow-lg shadow-navy/20 disabled:opacity-60 disabled:cursor-not-allowed">
                {submitting ? "Envoi en cours…" : <>Réserver mon étude gratuite <ArrowRight className="h-5 w-5" /></>}
              </button>
            </form>
            <div className="mt-3 text-center text-xs text-muted">Réponse sous 24 h · sans engagement · vos données restent confidentielles</div>
            <div className="mt-4 text-center"><button onClick={() => setStep("result")} className="text-xs text-muted hover:text-anthra underline underline-offset-2">← Revenir à mon estimation</button></div>
          </div>
        )}

        {/* CONFIRM */}
        {step === "confirm" && result && (
          <div className="max-w-lg mx-auto px-5 py-20 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-gainBg grid place-items-center"><Check className="h-8 w-8 text-gain" /></div>
            <h2 className="mt-6 font-display text-4xl lg:text-5xl tracking-tightest text-anthra">C&apos;est noté&nbsp;!</h2>
            <p className="mt-3 text-taupe">Un technicien Chauffage Artisanal vous rappelle <strong className="text-anthra">sous 24&nbsp;h</strong> avec votre étude personnalisée.</p>
            {reference && <p className="mt-2 text-xs text-muted">Référence de votre demande&nbsp;: <strong className="text-anthra">{reference}</strong></p>}
            <div className="mt-7 inline-block rounded-2xl bg-gainBg border border-gain/20 px-7 py-5">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-gain">Rappel de votre potentiel</div>
              <div className="mt-1 font-display text-4xl tracking-tightest text-gain">+{fmt(result.gain10ans)} €</div>
              <div className="text-sm text-gain/70">de gain estimé sur 10 ans</div>
            </div>

            {/* RDV visite technique — micro-engagement post-capture, créneaux réels */}
            {bookedSlot ? (
              <div className="mt-7 rounded-2xl bg-white border border-pierre px-6 py-5 text-left">
                <div className="flex items-center gap-2.5">
                  <span className="grid place-items-center h-8 w-8 rounded-full bg-gainBg shrink-0"><Check className="h-4 w-4 text-gain" /></span>
                  <div>
                    <div className="font-semibold text-anthra">Visite technique réservée</div>
                    <div className="text-sm text-taupe capitalize">{bookedSlot.date} · {bookedSlot.time} <span className="normal-case">(45 min, à votre domicile)</span></div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted">Nous confirmons le créneau par email. S&apos;il doit bouger, on vous appelle avant.</p>
              </div>
            ) : slots.length > 0 ? (
              <div className="mt-7 rounded-2xl bg-white border border-pierre px-6 py-5 text-left">
                <div className="font-semibold text-anthra">Gagnez du temps : réservez votre visite technique</div>
                <p className="mt-1 text-sm text-taupe">Gratuite, 45 min — le technicien valide votre estimation sur place.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[...new Set(slots.map((s) => s.date))].slice(0, 5).map((d) => (
                    <button key={d} onClick={() => setSlotDay(d)}
                      className={`rounded-xl border px-3 py-2 text-xs font-medium capitalize transition ${slotDay === d ? "border-bleu bg-voile text-bleu" : "border-pierre bg-white text-taupe hover:border-bleu/50"}`}>
                      {d}
                    </button>
                  ))}
                </div>
                {slotDay && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {slots.filter((s) => s.date === slotDay).map((s) => (
                      <button key={s.iso} disabled={bookingBusy} onClick={() => bookSlot(s)}
                        className="rounded-full border border-bleu/40 bg-white text-bleu px-4 py-2 text-sm font-semibold hover:bg-bleu hover:text-creme transition disabled:opacity-50">
                        {s.time}
                      </button>
                    ))}
                  </div>
                )}
                {bookingError && <div className="mt-3 rounded-xl bg-perteBg border border-perte/20 px-4 py-2.5 text-sm text-perte">{bookingError}</div>}
                <p className="mt-3 text-xs text-muted">Facultatif — sans créneau, un technicien vous rappelle sous 24 h.</p>
              </div>
            ) : null}

            <div className="mt-8"><button onClick={restart} className="text-xs text-muted hover:text-anthra underline underline-offset-2">Faire une nouvelle estimation</button></div>
          </div>
        )}
      </main>

      {/* MODAL AIDES */}
      {modal && result && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={() => setModal(false)} />
          <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:m-auto sm:max-w-lg sm:h-fit bg-white rounded-t-[28px] sm:rounded-[28px] border border-pierre shadow-2xl max-h-[88vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 pt-6 pb-3 border-b border-pierre flex items-start justify-between gap-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-gain">Argent à récupérer</div>
                <h3 className="mt-1 font-display text-2xl tracking-tight text-anthra">Les aides que vous pouvez obtenir</h3>
              </div>
              <button onClick={() => setModal(false)} className="h-9 w-9 grid place-items-center rounded-full border border-pierre text-anthra hover:bg-anthra hover:text-white transition shrink-0"><X className="h-4 w-4" /></button>
            </div>
            <div className="px-6 py-3">
              <AideRow label="Klimabonus 2026" value={<Amt v={result.aides.klimabonus} />} note={`${logement === "maison" ? "Maison (unifamilial)" : "Appartement (collectif)"} · ${result.aides.klimabonusContexte.toLowerCase()} · forfait officiel`} />
              <AideRow label="Aide communale (Klimapakt)" value={result.aides.communal.aConfirmer ? <span className="font-display text-lg text-gain whitespace-nowrap">{fmt(result.aides.communal.min)} – {fmt(result.aides.communal.max)} €</span> : <Amt v={result.aides.communal.min} />} note={result.aides.communal.note} />
              <AideRow label="Enoprimes (CEE)" value={<Tag t="cumulable" />} note="Prime énergie de votre fournisseur (Enovos / Creos / SudEnergie)." />
              <AideRow label="TVA logement 3 %" value={<Tag t="cumulable" />} note="Au lieu de 17 %, si le logement a plus de 10 ans." />
              <AideRow label="Klimaprêt 1,5 %" value={<Tag t="sur le reste" />} note="Prêt à taux réduit pour financer le reste à charge." />
              <AideRow label="Complément social" value={<Tag t="selon revenus" />} note="Ménages à revenus modestes : peut doubler le Klimabonus." />
            </div>
            <div className="px-6 pb-6">
              <div className="rounded-2xl bg-gainBg border border-gain/20 p-4 flex items-center justify-between">
                <span className="text-sm text-gain font-medium">Total aides directes estimé</span>
                <span className="font-display text-2xl text-gain">
                  {result.aides.total.min === result.aides.total.max ? `+ ${fmt(result.aides.total.min)} €` : `+ ${fmt(result.aides.total.min)} – ${fmt(result.aides.total.max)} €`}
                </span>
              </div>
              <p className="mt-3 text-[11px] text-muted">Aides directes = Klimabonus + aide communale. Enoprimes, TVA, Klimaprêt et complément social s&apos;ajoutent selon votre profil. Montants confirmés lors de l&apos;étude (accord de principe avant devis). Source : guichet.public.lu.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── helpers d'affichage ── */
function Stepwrap({ n, titre, sous, children }: { n: string; titre: string; sous?: string; children: React.ReactNode }) {
  return (
    <div className="max-w-2xl mx-auto px-5 py-14 lg:py-20">
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-taupe">Étape {n} / 4</div>
      <h2 className="mt-3 font-display text-4xl lg:text-5xl tracking-tightest text-anthra">{titre}</h2>
      {sous && <p className="mt-3 text-taupe">{sous}</p>}
      {children}
    </div>
  );
}
function Choice({ title, sub, onClick }: { title: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left rounded-2xl border border-pierre bg-white p-5 hover:border-bleu hover:shadow-lg hover:-translate-y-0.5 transition">
      <div className="font-display text-2xl text-anthra">{title}</div>
      <div className="text-sm text-taupe mt-1">{sub}</div>
    </button>
  );
}
function AideRow({ label, value, note }: { label: string; value: React.ReactNode; note: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-pierre last:border-0">
      <span className="mt-1.5 inline-block h-2 w-2 rounded-full bg-gain shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3"><span className="font-semibold text-anthra">{label}</span>{value}</div>
        <div className="text-xs text-taupe mt-0.5">{note}</div>
      </div>
    </div>
  );
}
const Amt = ({ v }: { v: number }) => <span className="font-display text-lg text-gain whitespace-nowrap">+ {fmt(v)} €</span>;
const Tag = ({ t }: { t: string }) => <span className="text-[10px] font-mono uppercase tracking-eyebrow text-gain bg-gainBg border border-gain/20 px-2 py-0.5 rounded-full whitespace-nowrap">{t}</span>;

function phraseEnergie(c: ChauffageActuel) {
  switch (c) {
    case "Mazout": return "de mazout partent en fumée";
    case "Gaz": return "de gaz partent en fumée";
    case "Électrique": return "d'électricité s'envolent";
    case "Bois": return "de bois partent en fumée";
    default: return "de chauffage partent en fumée";
  }
}

/* ── mapping estimation → payload lead /api/devis (schéma DevisSubmit) ── */
function energyToEnum(c: ChauffageActuel): "fioul" | "gaz" | "electrique" | "bois" | "autre" {
  switch (c) {
    case "Mazout": return "fioul";
    case "Gaz": return "gaz";
    case "Électrique": return "electrique";
    case "Bois": return "bois";
    default: return "autre";
  }
}
function budgetToEnum(n: number): "less10" | "10-25" | "25-50" | "50-100" | "100plus" {
  if (n < 10000) return "less10";
  if (n < 25000) return "10-25";
  if (n < 50000) return "25-50";
  if (n < 100000) return "50-100";
  return "100plus";
}
function readLeadSource(): unknown {
  try {
    if (typeof window === "undefined") return undefined;
    const raw = window.sessionStorage.getItem("ca-lead-source");
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function buildLeadPayload(args: {
  result: EstimationResult;
  commune: string;
  logement: Logement;
  chauffage: ChauffageActuel;
  facture: number;
  form: { nom: string; email: string; tel: string; timeline: Timeline; rappel: string; rgpd: boolean };
}) {
  const { result, commune, logement, chauffage, facture, form } = args;
  const communeLabel = commune === "Autre" ? "Autre commune" : commune;
  // Surface estimée à partir de la puissance dimensionnée (≈ 12 m²/kW) — indicative.
  const surface = Math.min(20000, Math.max(10, Math.round(result.puissanceKw * 12)));
  const aidesStr =
    result.aides.total.min === result.aides.total.max
      ? `${fmt(result.aides.total.min)} €`
      : `${fmt(result.aides.total.min)}–${fmt(result.aides.total.max)} €`;

  const message = [
    "Demande issue de l'estimateur en ligne.",
    `Logement : ${logement === "maison" ? "Maison" : "Appartement"} à ${communeLabel}.`,
    `Chauffage actuel : ${chauffage} (~${fmt(facture)} €/an).`,
    `Projet recommandé : ${result.equipement}.`,
    "Estimation (chiffres indicatifs, à confirmer lors de l'étude) :",
    `• Économie ~${fmt(result.economieAnnuelle)} €/an · gain 10 ans ~${fmt(result.gain10ans)} €`,
    `• Aides directes ~${aidesStr} (Klimabonus ${fmt(result.aides.klimabonus)} €)`,
    `• Budget installation ~${fmt(result.budget)} € · reste à charge ~${fmt(result.resteACharge)} €`,
    `• ROI ~${result.roiAnnees != null ? String(result.roiAnnees).replace(".", ",") : "—"} ans`,
    `Rappel souhaité : ${form.rappel}.`,
  ].join("\n");

  return {
    trap: "",
    services: ["pac"],
    buildingType: logement === "maison" ? "maison" : "appartement",
    construction: "renovation",
    surface,
    currentEnergy: energyToEnum(chauffage),
    commune: communeLabel,
    timeline: form.timeline,
    budget: budgetToEnum(result.budget),
    preferredBrand: "aucune",
    photos: [],
    fullName: form.nom.trim(),
    email: form.email.trim(),
    phone: form.tel.trim(),
    preferredChannel: "phone",
    message,
    rgpdConsent: true,
    metadata: {
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      locale: typeof navigator !== "undefined" ? navigator.language : undefined,
      source: readLeadSource(),
      // Contexte chiffré de l'estimation (référentiel = source de vérité).
      estimation: {
        commune: communeLabel,
        logement,
        chauffage,
        factureAnnuelle: facture,
        economieAnnuelle: result.economieAnnuelle,
        gain10ans: result.gain10ans,
        klimabonus: result.aides.klimabonus,
        aidesTotalMin: result.aides.total.min,
        aidesTotalMax: result.aides.total.max,
        budget: result.budget,
        resteACharge: result.resteACharge,
        roiAnnees: result.roiAnnees,
        puissanceKw: result.puissanceKw,
      },
      estimatedValue: result.budget,
      origin: "estimateur",
    },
  };
}
