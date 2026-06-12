import type { Metadata } from "next";
import { Estimateur } from "@/components/estimateur/estimateur";
import { COMMUNES_LU, type ChauffageActuel } from "@/lib/referentiel/estimation";

export const metadata: Metadata = {
  title: "Estimation gratuite — votre économie & vos aides en 60 secondes",
  description:
    "Sur votre vraie facture, découvrez en 60 secondes votre économie annuelle, vos aides Klimabonus 2026 et votre gain sur 10 ans en passant à la pompe à chaleur.",
  alternates: { canonical: "/estimation" },
};

/** Normalise le paramètre ?chauffage= du hero vers le type interne. */
function normalizeChauffage(v?: string): ChauffageActuel | undefined {
  if (!v) return undefined;
  switch (v.toLowerCase()) {
    case "mazout": case "fioul": return "Mazout";
    case "gaz": return "Gaz";
    case "electrique": case "électrique": case "elec": return "Électrique";
    case "bois": case "pellets": return "Bois";
    case "autre": case "pac": return "Autre";
    default: return undefined;
  }
}

export default function EstimationPage({
  searchParams,
}: {
  searchParams?: { commune?: string; chauffage?: string };
}) {
  const communeParam = searchParams?.commune;
  const commune = communeParam && COMMUNES_LU.includes(communeParam) ? communeParam : undefined;
  const chauffage = normalizeChauffage(searchParams?.chauffage);

  // Hero → commune + chauffage déjà choisis : on saute directement au logement.
  const deepLink = Boolean(commune && chauffage);

  return (
    <Estimateur
      initialCommune={commune}
      initialChauffage={chauffage}
      initialStep={deepLink ? "logement" : undefined}
    />
  );
}
