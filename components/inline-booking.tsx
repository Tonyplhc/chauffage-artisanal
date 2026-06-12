"use client";

/**
 * Booking inline — choisir un créneau de visite technique.
 *
 * Dev : les créneaux sont générés côté client (du lendemain à J+14, créneaux
 * matin 9-10h30 / après-midi 14-15h30, lun-ven uniquement).
 * En prod : à brancher sur Google Calendar / Outlook via une API freebusy.
 *
 * Le submit crée un lead minimal via /api/booking avec slot dans metadata
 * et services=["autre"] (à requalifier en RDV).
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  X as XIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { Eyebrow, Reveal, SectionTitle } from "@/components/ui";

type Slot = {
  id: string;
  date: Date;
  label: string;
  partOfDay: "morning" | "afternoon";
};

const HORIZON_DAYS = 14;
const SLOTS_PER_DAY: { time: string; partOfDay: "morning" | "afternoon" }[] = [
  { time: "09:00", partOfDay: "morning" },
  { time: "10:30", partOfDay: "morning" },
  { time: "14:00", partOfDay: "afternoon" },
  { time: "15:30", partOfDay: "afternoon" },
];

function generateSlots(): Slot[] {
  const out: Slot[] = [];
  const now = new Date();
  // Démarrer demain matin
  const start = new Date(now);
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);

  for (let d = 0; d < HORIZON_DAYS; d++) {
    const day = new Date(start);
    day.setDate(start.getDate() + d);
    const dow = day.getDay(); // 0 = dim, 6 = sam
    if (dow === 0 || dow === 6) continue; // Pas de RDV weekend en dev
    for (const s of SLOTS_PER_DAY) {
      const [hh, mm] = s.time.split(":").map(Number);
      const slotDate = new Date(day);
      slotDate.setHours(hh, mm, 0, 0);
      out.push({
        id: slotDate.toISOString(),
        date: slotDate,
        label: s.time,
        partOfDay: s.partOfDay,
      });
    }
  }
  return out;
}

function formatDayHeader(d: Date) {
  const day = d.toLocaleDateString("fr-FR", { weekday: "short" });
  const num = d.getDate();
  const month = d.toLocaleDateString("fr-FR", { month: "short" });
  return { day, num, month };
}

export function InlineBooking() {
  const allSlots = useMemo(generateSlots, []);
  const days = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of allSlots) {
      const key = s.date.toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).map(([key, slots]) => ({
      key,
      date: new Date(key),
      slots,
    }));
  }, [allSlots]);

  // Pagination : 7 jours visibles à la fois
  const [pageStart, setPageStart] = useState(0);
  const PAGE_SIZE = 7;
  const visibleDays = days.slice(pageStart, pageStart + PAGE_SIZE);
  const canPrev = pageStart > 0;
  const canNext = pageStart + PAGE_SIZE < days.length;

  // Slot sélectionné + modal form
  const [selected, setSelected] = useState<Slot | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <section id="booking" className="py-14 lg:py-20 bg-creme border-y border-pierre">
      <div className="container">
        <div className="max-w-3xl mb-10">
          <Eyebrow number="06">Visite technique</Eyebrow>
          <Reveal>
            <SectionTitle className="mt-4">
              Choisissez un créneau, <em className="not-italic text-bleu">on s&apos;adapte</em>.
            </SectionTitle>
          </Reveal>
          <Reveal delay={1}>
            <p className="mt-5 text-taupe leading-relaxed">
              Visite technique gratuite et sans engagement. Nous confirmons par email sous
              quelques heures ouvrées. Si aucun créneau ne vous convient, écrivez-nous —
              on trouve toujours.
            </p>
          </Reveal>
        </div>

        <div className="rounded-3xl border border-pierre bg-white shadow-soft overflow-hidden">
          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-pierre bg-creme/50">
            <button
              onClick={() => setPageStart((v) => Math.max(0, v - PAGE_SIZE))}
              disabled={!canPrev}
              className={`h-9 w-9 grid place-items-center rounded-full transition-colors ${
                canPrev
                  ? "bg-white border border-pierre text-anthra hover:border-bleu/40"
                  : "text-muted/40 cursor-not-allowed"
              }`}
              aria-label="Semaine précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-taupe">
              <Calendar className="inline-block h-3.5 w-3.5 mr-1.5 text-bleu" />
              {visibleDays[0]?.date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} —{" "}
              {visibleDays[visibleDays.length - 1]?.date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
            </div>
            <button
              onClick={() => setPageStart((v) => Math.min(days.length - PAGE_SIZE, v + PAGE_SIZE))}
              disabled={!canNext}
              className={`h-9 w-9 grid place-items-center rounded-full transition-colors ${
                canNext
                  ? "bg-white border border-pierre text-anthra hover:border-bleu/40"
                  : "text-muted/40 cursor-not-allowed"
              }`}
              aria-label="Semaine suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Grille jours / créneaux */}
          <div className="p-5 lg:p-7 overflow-x-auto">
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${visibleDays.length}, minmax(110px, 1fr))` }}
            >
              {visibleDays.map((d) => {
                const h = formatDayHeader(d.date);
                return (
                  <div key={d.key} className="space-y-2">
                    <div className="text-center">
                      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                        {h.day}
                      </div>
                      <div className="mt-0.5 font-display text-xl text-anthra tabular-nums">
                        {h.num}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                        {h.month}
                      </div>
                    </div>
                    <div className="space-y-1.5 pt-2">
                      {d.slots.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setSelected(s);
                            setOpen(true);
                          }}
                          className="w-full px-3 py-2 rounded-lg text-sm font-mono text-anthra bg-creme hover:bg-bleu hover:text-creme border border-pierre hover:border-bleu transition-colors"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer info */}
          <div className="px-5 py-3 border-t border-pierre bg-creme/40 text-xs text-muted text-center">
            <Clock className="inline-block h-3 w-3 mr-1.5 text-bleu" />
            Créneaux indicatifs · confirmation par email après réception
          </div>
        </div>
      </div>

      {/* Modal form de réservation */}
      <AnimatePresence>
        {open && selected && (
          <BookingModal
            slot={selected}
            onClose={() => {
              setOpen(false);
              setSelected(null);
            }}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

/* ─────────────── Modal ─────────────── */

function BookingModal({ slot, onClose }: { slot: Slot; onClose: () => void }) {
  const [step, setStep] = useState<"form" | "submitting" | "success">("form");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    note: "",
  });

  const canSubmit =
    form.fullName.trim().length >= 2 &&
    /@/.test(form.email) &&
    form.phone.trim().length >= 6;

  const submit = async () => {
    setStep("submitting");
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          slot: slot.date.toISOString(),
        }),
      });
      if (!res.ok) {
        setStep("form");
        return;
      }
      setStep("success");
    } catch {
      setStep("form");
    }
  };

  const dateLabel = slot.date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[80] bg-navy/50 backdrop-blur-sm grid place-items-center p-4 lg:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 16, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="w-full max-w-lg bg-white rounded-3xl border border-pierre shadow-lift overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-pierre flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu">
              Réserver un créneau
            </div>
            <div className="mt-1.5 font-display text-xl text-anthra tracking-tight">
              {dateLabel} · {slot.label}
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 grid place-items-center rounded-full bg-creme border border-pierre text-taupe hover:bg-navy hover:text-creme transition-colors shrink-0"
            aria-label="Fermer"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {step === "success" ? (
            <div className="text-center py-4">
              <div className="h-14 w-14 mx-auto rounded-full bg-[#2E7D5A]/10 border border-[#2E7D5A]/40 grid place-items-center">
                <CheckCircle2 className="h-6 w-6 text-[#2E7D5A]" />
              </div>
              <h3 className="mt-5 font-display text-2xl text-anthra tracking-tight">
                Créneau enregistré
              </h3>
              <p className="mt-3 text-taupe text-sm leading-relaxed max-w-sm mx-auto">
                Nous vous confirmons par email sous quelques heures ouvrées. Si urgence,
                appelez-nous directement.
              </p>
              <button
                onClick={onClose}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-navy text-creme px-5 py-3 text-sm font-medium hover:bg-bleu transition-colors"
              >
                Fermer
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                <Input
                  label="Nom complet"
                  value={form.fullName}
                  onChange={(v) => setForm({ ...form, fullName: v })}
                  placeholder="Prénom NOM"
                />
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(v) => setForm({ ...form, email: v })}
                    placeholder="vous@email.lu"
                  />
                  <Input
                    label="Téléphone"
                    type="tel"
                    value={form.phone}
                    onChange={(v) => setForm({ ...form, phone: v })}
                    placeholder="+352…"
                  />
                </div>
                <Input
                  label="Adresse de la visite"
                  value={form.address}
                  onChange={(v) => setForm({ ...form, address: v })}
                  placeholder="Rue, commune"
                />
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2 block">
                    Quelques mots sur votre projet (optionnel)
                  </label>
                  <textarea
                    rows={3}
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder="Type de bâtiment, services envisagés, contraintes…"
                    className="w-full bg-creme border border-pierre rounded-xl px-4 py-2.5 text-sm text-anthra focus:border-bleu focus:outline-none focus:ring-2 focus:ring-bleu/20 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  onClick={onClose}
                  className="inline-flex items-center gap-2 text-sm text-taupe hover:text-anthra transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Annuler
                </button>
                <button
                  onClick={submit}
                  disabled={!canSubmit || step === "submitting"}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-all ${
                    canSubmit && step !== "submitting"
                      ? "bg-navy text-creme hover:bg-bleu"
                      : "bg-sable/60 text-anthra/40 cursor-not-allowed"
                  }`}
                >
                  {step === "submitting" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Envoi…
                    </>
                  ) : (
                    <>
                      Réserver
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2 block">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-creme border border-pierre rounded-xl px-4 py-2.5 text-sm text-anthra focus:border-bleu focus:outline-none focus:ring-2 focus:ring-bleu/20 transition-all"
      />
    </div>
  );
}
