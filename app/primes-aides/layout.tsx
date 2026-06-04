import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Primes & aides énergie Luxembourg — Klimabonus, PAC, rénovation",
  description:
    "Vue d'ensemble des aides énergétiques au Luxembourg : Klimabonus, soutien aux pompes à chaleur, au solaire, à la rénovation énergétique. Vérification d'éligibilité avant devis.",
  keywords: [
    "primes énergie Luxembourg",
    "Klimabonus",
    "aides pompe à chaleur Luxembourg",
    "rénovation énergétique Luxembourg",
    "MyEnergy",
    "aides solaire photovoltaïque Luxembourg",
    "primes chaudière Luxembourg",
    "aides communales énergie",
  ],
  openGraph: {
    title: "Primes & aides énergie au Luxembourg",
    description:
      "Klimabonus, aides communales, dispositifs solaire et rénovation : vue d'ensemble claire et accompagnement technique avant devis.",
  },
};

export default function PrimesAidesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
