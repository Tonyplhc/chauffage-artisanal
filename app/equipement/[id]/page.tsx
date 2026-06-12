"use client";

/**
 * Page publique fiche équipement (scan QR code).
 *
 * Sécurisé par token HMAC. Affiche les infos techniques (marque, modèle, SN,
 * garantie) et un bouton "Demander un SAV" qui redirige vers /contact ou
 * /devis avec le contexte.
 */

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Cpu,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  Phone,
  Mail,
  Calendar,
} from "lucide-react";

type Equipment = {
  id: string;
  type: string;
  brand: string;
  model: string;
  serialNumber?: string;
  power?: string;
  installedAt?: string;
  warrantyExpiresAt?: string;
  location?: string;
  notes?: string;
  status: string;
};

const TYPE_LABELS: Record<string, string> = {
  chaudiere: "Chaudière",
  pac: "Pompe à chaleur",
  ballon: "Ballon thermo",
  clim: "Climatisation",
  vmc: "VMC",
  solaire: "Solaire thermique",
  regulation: "Régulation",
  autre: "Autre équipement",
};

export default function PublicEquipmentPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const token = search.get("t") ?? "";

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/equipment/${params.id}?t=${token}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => setEquipment(d.equipment))
      .catch(() => setError("Lien invalide ou expiré."));
  }, [params.id, token]);

  if (error) {
    return (
      <div className="min-h-screen bg-cream grid place-items-center px-4">
        <div className="max-w-md text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-ember mb-3" />
          <p className="text-graphite">{error}</p>
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="min-h-screen bg-cream grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-copper" />
      </div>
    );
  }

  const warrantyOk =
    equipment.warrantyExpiresAt &&
    new Date(equipment.warrantyExpiresAt).getTime() > Date.now();

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-16 px-4">
      <div className="container max-w-2xl">
        <div className="bg-white rounded-3xl border border-ink/10 shadow-soft p-6 lg:p-10">
          {/* Header */}
          <div className="text-center mb-6 pb-6 border-b border-ink/8">
            <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-copper bg-copper/10 border border-copper/20 px-3 py-1 rounded-full">
              <Cpu className="h-3 w-3" />
              Fiche équipement
            </div>
            <h1 className="mt-4 font-display text-3xl text-ink">
              {equipment.brand}
            </h1>
            <p className="mt-1 text-lg text-graphite">{equipment.model}</p>
            <p className="mt-2 text-xs font-mono text-muted">
              {TYPE_LABELS[equipment.type] ?? equipment.type}
              {equipment.power && ` · ${equipment.power}`}
            </p>
          </div>

          {/* Specs */}
          <dl className="grid grid-cols-2 gap-4 mb-6 text-sm">
            {equipment.serialNumber && (
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                  Numéro de série
                </dt>
                <dd className="mt-0.5 font-mono text-ink">
                  {equipment.serialNumber}
                </dd>
              </div>
            )}
            {equipment.location && (
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                  Emplacement
                </dt>
                <dd className="mt-0.5 text-ink">{equipment.location}</dd>
              </div>
            )}
            {equipment.installedAt && (
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                  Date de pose
                </dt>
                <dd className="mt-0.5 text-ink inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-copper" />
                  {new Date(equipment.installedAt).toLocaleDateString("fr-FR", {
                    dateStyle: "medium",
                  })}
                </dd>
              </div>
            )}
            {equipment.warrantyExpiresAt && (
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                  Garantie
                </dt>
                <dd
                  className={`mt-0.5 inline-flex items-center gap-1 ${
                    warrantyOk ? "text-[#22a06b]" : "text-ember"
                  }`}
                >
                  <ShieldCheck className="h-3 w-3" />
                  {warrantyOk ? "Active jusqu'au" : "Expirée le"}{" "}
                  {new Date(equipment.warrantyExpiresAt).toLocaleDateString(
                    "fr-FR",
                    { dateStyle: "medium" },
                  )}
                </dd>
              </div>
            )}
          </dl>

          {equipment.notes && (
            <div className="mb-6 p-4 rounded-2xl bg-cream border border-ink/8">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-1">
                Notes
              </div>
              <p className="text-sm text-graphite whitespace-pre-wrap">
                {equipment.notes}
              </p>
            </div>
          )}

          {/* SAV CTAs */}
          <div className="pt-6 border-t border-ink/8">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3 text-center">
              Demander une intervention SAV
            </div>
            <div className="grid sm:grid-cols-3 gap-2">
              <a
                href="tel:+352000000000"
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-ink text-cream py-3 text-sm font-medium hover:bg-copper transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                Appeler
              </a>
              <a
                href={`mailto:contact@chauffage-artisanal.lu?subject=SAV%20${encodeURIComponent(equipment.brand + " " + equipment.model)}`}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white border border-ink/15 py-3 text-sm font-medium hover:border-copper/40 transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                Email
              </a>
              <Link
                href={`/contact?ref=equip:${equipment.id}`}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-copper/10 border border-copper/30 text-copper py-3 text-sm font-medium hover:bg-copper hover:text-cream transition-colors"
              >
                Formulaire
              </Link>
            </div>
            <p className="mt-3 text-[11px] text-muted text-center">
              Lien sécurisé personnel — accessible via le QR code apposé sur
              votre équipement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
