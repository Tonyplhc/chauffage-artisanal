"use client";

import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { PageHeader, Eyebrow, Reveal } from "@/components/ui";
import { HeroAside } from "@/components/hero-aside";
import { InlineBooking } from "@/components/inline-booking";
import { COMPANY } from "@/lib/company-info";
import { trackEvent } from "@/lib/track-event";
import { OsmMap } from "@/components/osm-map";
import { PublicTransport } from "@/components/public-transport";
import { OpeningHoursTable } from "@/components/opening-hours";

const SUBJECTS = [
  "Devis chauffage",
  "Devis pompe à chaleur",
  "Devis climatisation",
  "Devis sanitaire",
  "Contrat d'entretien",
  "Énergies renouvelables",
  "Recrutement",
  "Autre",
];

// Mappe l'objet du formulaire vers un service du schéma /devis (sinon ["autre"]).
const SUBJECT_SERVICE: Record<string, string[]> = {
  "Devis chauffage": ["chauffage"],
  "Devis pompe à chaleur": ["pac"],
  "Devis climatisation": ["clim"],
  "Devis sanitaire": ["sanitaire"],
  "Énergies renouvelables": ["enr"],
};

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) ?? "").trim();
    const nom = get("nom");
    const prenom = get("prenom");
    const objet = get("objet");
    const rawMessage = get("message");
    const zone = get("zone");
    const fullName = `${nom} ${prenom}`.trim() || nom || prenom;
    const message = objet ? `[${objet}] ${rawMessage}`.trim() : rawMessage;

    const payload = {
      services: SUBJECT_SERVICE[objet] ?? ["autre"],
      buildingType: "autre",
      construction: "renovation",
      surface: 100,
      currentEnergy: "inconnu",
      commune: zone || "À préciser",
      timeline: "exploration",
      budget: "inconnu",
      preferredBrand: "aucune",
      fullName,
      email: get("email"),
      phone: get("tel"),
      preferredChannel: "phone",
      message,
      rgpdConsent: true,
      trap: "",
      photos: [],
      metadata: { contactForm: true, subject: objet },
    };

    try {
      const res = await fetch("/api/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 429) {
        setError("Trop de demandes. Merci de réessayer dans une minute.");
        return;
      }
      if (!res.ok) {
        setError("Envoi impossible pour le moment. Réessayez ou appelez-nous.");
        return;
      }
      setSent(true);
      trackEvent("contact_submitted", { subject: objet });
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau ou appelez-nous.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        number="11"
        eyebrow="Contact"
        title={
          <>
            Décrivez-nous votre projet.{" "}
            <em className="not-italic text-copper">Nous vous rappelons sous 4h ouvrées</em>.
          </>
        }
        intro={
          <>
            Pour un devis, une visite technique, un contrat d&apos;entretien ou une question. Pour l&apos;urgence — composez directement le <strong className="text-copper font-semibold">numéro 24/7</strong>.
          </>
        }
        aside={
          <HeroAside
            icon={Clock}
            eyebrow="Délais de réponse"
            items={[
              { label: "Demande de devis", body: "Rappel sous 4h ouvrées" },
              { label: "Visite technique", body: "Sous quelques jours selon agenda" },
              { label: "Urgence dépannage", body: "Appel direct, conditions sur place" },
            ]}
            footnote="Zone Luxembourg & Grande Région sur projet"
          />
        }
      />

      <section className="py-12 lg:py-20 bg-cream">
        <div className="container grid lg:grid-cols-12 gap-12 lg:gap-16">
          {/* FORM */}
          <div className="lg:col-span-7">
            <Eyebrow number="01">Formulaire</Eyebrow>
            <Reveal>
              <h2 className="mt-5 font-display text-3xl lg:text-4xl tracking-tight text-ink">
                Demande de devis ou de rappel
              </h2>
            </Reveal>

            <form onSubmit={handleSubmit} className="mt-10 grid gap-5">
              <div className="grid md:grid-cols-2 gap-5">
                <Field label="Nom" name="nom" required />
                <Field label="Prénom" name="prenom" required />
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <Field label="Email" name="email" type="email" required />
                <Field label="Téléphone" name="tel" type="tel" required />
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <Field label="Code postal · ville" name="zone" />
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2">
                    Objet
                  </label>
                  <select
                    name="objet"
                    className="w-full bg-white border border-ink/12 rounded-xl px-4 py-3.5 text-ink focus:border-copper focus:outline-none transition-colors"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2">
                  Décrivez votre projet
                </label>
                <textarea
                  name="message"
                  rows={6}
                  className="w-full bg-white border border-ink/12 rounded-xl px-4 py-3.5 text-ink focus:border-copper focus:outline-none transition-colors resize-none"
                  placeholder="Type de bâtiment, surface, équipement actuel, contraintes, délais souhaités…"
                />
              </div>
              <label className="flex items-start gap-3 text-xs text-graphite">
                <input type="checkbox" className="mt-0.5 accent-copper" required />
                <span>
                  J'accepte que mes données soient utilisées pour traiter ma demande (RGPD,
                  Luxembourg).
                </span>
              </label>

              {error && (
                <p className="text-sm text-ember" role="alert">
                  {error}
                </p>
              )}
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting || sent}
                className="group mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-ink text-cream px-7 py-4 text-sm font-medium hover:bg-copper transition-all hover:-translate-y-0.5 self-start disabled:opacity-60 disabled:pointer-events-none"
              >
                {sent
                  ? "Reçu — nous vous recontactons"
                  : submitting
                    ? "Envoi…"
                    : "Envoyer la demande"}
                <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </motion.button>
            </form>
          </div>

          {/* COORDONNÉES */}
          <aside className="lg:col-span-5">
            <Eyebrow number="02">L'atelier</Eyebrow>
            <Reveal>
              <h2 className="mt-5 font-display text-3xl lg:text-4xl tracking-tight text-ink">
                Venir, appeler, écrire
              </h2>
            </Reveal>

            <div className="mt-10 grid gap-5">
              <InfoCard
                icon={Phone}
                title="Téléphone"
                lines={[COMPANY.phone.display, "Décrochage par technicien"]}
              />
              <InfoCard
                icon={Mail}
                title="Email"
                lines={[COMPANY.email, "Réponse dans des délais raisonnables"]}
              />
              <InfoCard
                icon={MapPin}
                title="Atelier"
                lines={[
                  `${COMPANY.address.street}, ${COMPANY.address.postalCode} ${COMPANY.address.city}`,
                  `Commune de ${COMPANY.address.commune}`,
                ]}
              />
            </div>

            {/* Horaires détaillés — table semaine + statut Ouvert/Fermé temps réel */}
            <div className="mt-6 rounded-2xl border border-ink/10 bg-white shadow-soft p-5 lg:p-6">
              <OpeningHoursTable />
            </div>

            <div className="mt-10 p-6 rounded-2xl bg-ember/8 border border-ember/30">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-ember">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember opacity-75"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ember"></span>
                </span>
                Urgence
              </div>
              <p className="mt-3 text-sm text-ink/90">
                Plus de chauffage, fuite d&apos;eau, panne climatisation ? Contactez-nous au{" "}
                <strong>{COMPANY.phone.display}</strong> — astreinte technique active hors
                horaires de bureau.
              </p>
              <a
                href={`tel:${COMPANY.phone.tel}`}
                className="mt-4 inline-flex items-center gap-2 text-ink font-medium hover:text-copper transition-colors"
              >
                <Phone className="h-4 w-4" /> {COMPANY.phone.display}
              </a>
            </div>
          </aside>
        </div>
      </section>

      {/* INLINE BOOKING */}
      <InlineBooking />

      {/* MAP — vraie carte OpenStreetMap avec marker sur l'adresse réelle */}
      <section className="py-16 bg-cream">
        <div className="container">
          <div className="mb-6 flex items-end justify-between flex-wrap gap-3">
            <div>
              <Eyebrow number="📍">Nous trouver</Eyebrow>
              <h2 className="mt-3 font-display text-2xl lg:text-3xl text-ink tracking-tight">
                {COMPANY.address.street}
              </h2>
              <p className="mt-1 text-sm text-graphite">
                {COMPANY.address.postalCode} {COMPANY.address.city} · commune de{" "}
                {COMPANY.address.commune}
              </p>
            </div>
            <a
              href={`https://www.openstreetmap.org/?mlat=49.5225638&mlon=6.1276588#map=18/49.5225638/6.1276588`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white border border-ink/15 text-ink px-4 py-2 text-xs font-mono uppercase tracking-eyebrow hover:border-copper/40 transition-colors"
            >
              <MapPin className="h-3 w-3 text-copper" />
              Ouvrir dans OpenStreetMap
            </a>
          </div>
          <OsmMap />
        </div>
      </section>

      {/* Transport public — données RGTR vérifiées */}
      <PublicTransport />
    </>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2">
        {label}
        {required && <span className="text-copper ml-1">*</span>}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        className="w-full bg-white border border-ink/12 rounded-xl px-4 py-3.5 text-ink focus:border-copper focus:outline-none transition-colors"
      />
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  lines,
  href,
}: {
  icon: any;
  title: string;
  lines: string[];
  href?: string;
}) {
  const inner = (
    <div className="p-5 lg:p-6 rounded-2xl border border-ink/10 bg-white hover:border-copper/40 hover:shadow-lift transition-all flex gap-4 items-start">
      <span className="grid place-items-center h-10 w-10 rounded-full bg-copper/12 border border-copper/30 shrink-0">
        <Icon className="h-4 w-4 text-copper" />
      </span>
      <div>
        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">{title}</div>
        {lines.map((l, i) => (
          <div key={i} className={i === 0 ? "font-medium text-ink mt-1" : "text-xs text-muted mt-0.5"}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
  return href ? <a href={href}>{inner}</a> : inner;
}
