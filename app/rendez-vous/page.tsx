"use client";

/**
 * Prise de RDV en ligne publique.
 *
 * 3 étapes : choisir un créneau → renseigner ses coordonnées → confirmation.
 * Pas de création de compte. La réservation est "confirmée auto" mais le
 * client est prévenu qu'un humain validera.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Info,
} from "lucide-react";
import { PURPOSE_LABELS, type BookingPurpose } from "@/lib/booking-types";

type Slot = { iso: string; date: string; time: string };

export default function BookingPage() {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [step, setStep] = useState<"slot" | "form" | "done">("slot");
  const [chosen, setChosen] = useState<Slot | null>(null);
  const [purpose, setPurpose] = useState<BookingPurpose>("visite-technique");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [commune, setCommune] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/bookings", { cache: "no-store" });
      if (res.ok) {
        const d = await res.json();
        setSlots(d.slots ?? []);
      }
    })();
  }, []);

  const submit = async () => {
    if (!chosen) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotIso: chosen.iso,
          purpose,
          fullName,
          email,
          phone,
          commune,
          notes,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Erreur");
      setBookingId(d.booking?.id ?? "—");
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  // Group slots par date
  const grouped = (slots ?? []).reduce<Record<string, Slot[]>>((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-creme py-12 lg:py-16">
      <div className="container max-w-3xl">
        <div className="mb-8">
          <Link
            href="/"
            className="text-xs font-mono uppercase tracking-eyebrow text-taupe hover:text-bleu"
          >
            ← Retour accueil
          </Link>
          <h1 className="mt-4 font-display text-display-md text-anthra">
            Prendre rendez-vous
          </h1>
          <p className="mt-2 text-taupe max-w-2xl">
            Choisissez un créneau qui vous arrange. Nous confirmons par email
            sous 24 h ouvrées — il peut arriver qu&apos;on vous propose un autre
            créneau si une urgence se présente.
          </p>
        </div>

        {/* Steps */}
        <div className="mb-6 flex items-center gap-2 text-xs font-mono uppercase tracking-eyebrow">
          <StepBadge n={1} active={step === "slot"} done={step !== "slot"}>
            Créneau
          </StepBadge>
          <span className="text-muted">·</span>
          <StepBadge
            n={2}
            active={step === "form"}
            done={step === "done"}
          >
            Coordonnées
          </StepBadge>
          <span className="text-muted">·</span>
          <StepBadge n={3} active={step === "done"} done={false}>
            Confirmation
          </StepBadge>
        </div>

        {step === "slot" && (
          <SlotPicker
            slots={slots}
            grouped={grouped}
            onChoose={(s) => {
              setChosen(s);
              setStep("form");
            }}
          />
        )}

        {step === "form" && chosen && (
          <FormStep
            slot={chosen}
            purpose={purpose}
            setPurpose={setPurpose}
            fullName={fullName}
            setFullName={setFullName}
            email={email}
            setEmail={setEmail}
            phone={phone}
            setPhone={setPhone}
            commune={commune}
            setCommune={setCommune}
            notes={notes}
            setNotes={setNotes}
            onBack={() => setStep("slot")}
            onSubmit={submit}
            busy={busy}
            error={error}
          />
        )}

        {step === "done" && chosen && (
          <DoneStep slot={chosen} bookingId={bookingId} />
        )}
      </div>
    </div>
  );
}

function StepBadge({
  n,
  active,
  done,
  children,
}: {
  n: number;
  active: boolean;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${
        active
          ? "bg-navy text-creme"
          : done
            ? "bg-[#2E7D5A]/10 text-[#2E7D5A]"
            : "bg-creme border border-pierre text-taupe"
      }`}
    >
      {done ? <CheckCircle2 className="h-3 w-3" /> : <span>{n}</span>}
      {children}
    </span>
  );
}

function SlotPicker({
  slots,
  grouped,
  onChoose,
}: {
  slots: Slot[] | null;
  grouped: Record<string, Slot[]>;
  onChoose: (s: Slot) => void;
}) {
  if (slots === null) {
    return (
      <div className="py-12 text-center text-muted">
        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
      </div>
    );
  }
  if (slots.length === 0) {
    return (
      <div className="rounded-2xl border border-pierre bg-white shadow-soft py-12 text-center">
        <CalendarCheck className="h-10 w-10 text-bleu opacity-30 mx-auto mb-3" />
        <p className="text-taupe">
          Aucun créneau libre dans les 14 prochains jours. Contactez-nous
          directement.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([date, daySlots]) => (
        <div
          key={date}
          className="rounded-2xl border border-pierre bg-white shadow-soft overflow-hidden"
        >
          <div className="px-5 py-3 border-b border-pierre bg-creme/40 font-mono text-[10px] uppercase tracking-eyebrow text-bleu">
            {date}
          </div>
          <div className="p-4 grid grid-cols-3 lg:grid-cols-7 gap-2">
            {daySlots.map((s) => (
              <button
                key={s.iso}
                onClick={() => onChoose(s)}
                className="rounded-lg border border-pierre bg-creme hover:bg-navy hover:text-creme hover:border-anthra px-3 py-2 text-sm transition-colors inline-flex items-center justify-center gap-1"
              >
                <Clock className="h-3 w-3" />
                {s.time}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FormStep(props: {
  slot: Slot;
  purpose: BookingPurpose;
  setPurpose: (v: BookingPurpose) => void;
  fullName: string;
  setFullName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  commune: string;
  setCommune: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  busy: boolean;
  error: string | null;
}) {
  const valid =
    props.fullName.trim().length > 1 &&
    /.+@.+\..+/.test(props.email) &&
    props.phone.trim().length >= 6;

  return (
    <div className="rounded-2xl border border-pierre bg-white shadow-soft p-6 lg:p-8">
      <div className="rounded-xl bg-bleu/5 border border-bleu/20 px-4 py-3 mb-5 inline-flex items-center gap-2 w-full">
        <CalendarCheck className="h-4 w-4 text-bleu" />
        <span className="text-sm text-anthra">
          {props.slot.date} à <strong>{props.slot.time}</strong>
        </span>
        <button
          onClick={props.onBack}
          className="ml-auto text-xs text-bleu hover:underline"
        >
          Changer
        </button>
      </div>

      <div className="space-y-4">
        <Field label="Motif">
          <select
            value={props.purpose}
            onChange={(e) => props.setPurpose(e.target.value as BookingPurpose)}
            className="w-full bg-creme border border-pierre rounded-lg px-3 py-2 text-sm focus:border-bleu focus:outline-none"
          >
            {Object.entries(PURPOSE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Nom complet *">
            <input
              value={props.fullName}
              onChange={(e) => props.setFullName(e.target.value)}
              placeholder="Prénom Nom"
              className="w-full bg-creme border border-pierre rounded-lg px-3 py-2 text-sm focus:border-bleu focus:outline-none"
            />
          </Field>
          <Field label="Commune">
            <input
              value={props.commune}
              onChange={(e) => props.setCommune(e.target.value)}
              placeholder="Strassen"
              className="w-full bg-creme border border-pierre rounded-lg px-3 py-2 text-sm focus:border-bleu focus:outline-none"
            />
          </Field>
          <Field label="Email *">
            <input
              type="email"
              value={props.email}
              onChange={(e) => props.setEmail(e.target.value)}
              placeholder="vous@exemple.lu"
              className="w-full bg-creme border border-pierre rounded-lg px-3 py-2 text-sm focus:border-bleu focus:outline-none"
            />
          </Field>
          <Field label="Téléphone *">
            <input
              type="tel"
              value={props.phone}
              onChange={(e) => props.setPhone(e.target.value)}
              placeholder="+352 …"
              className="w-full bg-creme border border-pierre rounded-lg px-3 py-2 text-sm focus:border-bleu focus:outline-none"
            />
          </Field>
        </div>

        <Field label="Précisions">
          <textarea
            rows={3}
            value={props.notes}
            onChange={(e) => props.setNotes(e.target.value)}
            placeholder="Type d'équipement, contexte, contrainte d'accès…"
            className="w-full bg-creme border border-pierre rounded-lg px-3 py-2 text-sm focus:border-bleu focus:outline-none"
          />
        </Field>

        {props.error && (
          <div className="text-sm text-terracotta bg-terracotta/5 border border-terracotta/20 rounded-lg px-3 py-2">
            {props.error}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
          <button
            onClick={props.onBack}
            className="text-sm text-taupe hover:text-bleu"
          >
            ← Changer de créneau
          </button>
          <button
            onClick={props.onSubmit}
            disabled={!valid || props.busy}
            className="inline-flex items-center gap-2 rounded-full bg-navy text-creme px-5 py-2.5 text-sm hover:bg-bleu transition-colors disabled:opacity-50"
          >
            {props.busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5" />
            )}
            Confirmer la réservation
          </button>
        </div>
      </div>

      <p className="mt-5 text-[11px] text-muted">
        En confirmant, vous acceptez d&apos;être recontacté à l&apos;email et au
        téléphone fournis. Aucune information n&apos;est partagée hors équipe.
      </p>
    </div>
  );
}

function DoneStep({
  slot,
  bookingId,
}: {
  slot: Slot;
  bookingId: string | null;
}) {
  return (
    <div className="rounded-2xl border border-[#2E7D5A]/30 bg-white shadow-soft p-8 text-center">
      <CheckCircle2 className="h-12 w-12 text-[#2E7D5A] mx-auto mb-4" />
      <h2 className="font-display text-2xl text-anthra">
        Rendez-vous enregistré
      </h2>
      <p className="mt-2 text-taupe">
        Pour le <strong>{slot.date}</strong> à <strong>{slot.time}</strong>.
      </p>
      {bookingId && (
        <p className="mt-1 text-xs font-mono text-muted">
          Référence : {bookingId}
        </p>
      )}
      <div className="mt-6 rounded-xl bg-creme/50 border border-pierre px-4 py-3 text-sm text-taupe text-left max-w-md mx-auto inline-flex items-start gap-2">
        <Info className="h-4 w-4 text-bleu mt-0.5 shrink-0" />
        <span>
          Vous recevrez un email de confirmation. Si nous devons modifier le
          créneau, nous vous proposerons des alternatives.
        </span>
      </div>
      <div className="mt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-bleu hover:underline"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-taupe mb-1">
        {label}
      </div>
      {children}
    </div>
  );
}
