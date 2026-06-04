"use client";

/**
 * Page d'impression du QR code d'un équipement — à afficher en grand puis
 * imprimer et coller sur l'appareil.
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Loader2,
  Printer,
  ArrowLeft,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

type Data = {
  publicUrl: string;
  qrImageUrl: string;
  equipment: {
    brand: string;
    model: string;
    serialNumber?: string;
  };
};

export default function EquipmentQrPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/equipment/${params.id}/qr`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then(setData)
      .catch(() => setError("Erreur lors de la génération du QR."));
  }, [params.id]);

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

  if (!data) {
    return (
      <div className="min-h-screen bg-cream grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-copper" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14 px-4">
      <div className="container max-w-2xl">
        <div className="flex items-center justify-between gap-3 mb-6 print:hidden">
          <Link
            href={`/admin`}
            className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour
          </Link>
          <div className="flex items-center gap-2">
            <a
              href={data.publicUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-white border border-ink/15 px-4 py-2 text-sm hover:border-copper/40"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Aperçu public
            </a>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimer
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-ink/10 shadow-soft p-8 lg:p-12 text-center print:shadow-none print:border-0">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
            Fiche équipement · scan pour SAV
          </div>
          <h1 className="font-display text-2xl text-ink">
            {data.equipment.brand}
          </h1>
          <p className="text-lg text-graphite">{data.equipment.model}</p>
          {data.equipment.serialNumber && (
            <p className="mt-1 font-mono text-xs text-muted">
              SN : {data.equipment.serialNumber}
            </p>
          )}

          <div className="my-8 inline-block p-5 rounded-2xl bg-white border border-ink/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.qrImageUrl}
              alt="QR code"
              className="mx-auto"
              width={400}
              height={400}
            />
          </div>

          <p className="text-sm text-graphite max-w-md mx-auto">
            Scannez ce QR code pour accéder à la fiche technique et demander
            une intervention SAV.
          </p>
          <p className="mt-3 text-[10px] font-mono text-muted break-all">
            {data.publicUrl}
          </p>
          <div className="mt-6 pt-6 border-t border-ink/8 text-[10px] text-muted font-mono">
            Chauffage Artisanal · www.chauffage-artisanal.lu
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
