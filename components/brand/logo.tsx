import { cn } from "@/lib/utils";
import { LOGO } from "@/lib/brand";

/**
 * Logo officiel Chauffage Artisanal.
 *
 *  Règles (cf. lib/brand.ts → LOGO) :
 *    • variant="light" → logo COULEUR direct (fond crème / blanc / sable).
 *    • variant="dark"  → logo couleur sur PLAQUE CRÈME (fond bleu / navy).
 *                        Jamais de blanc inversé : on préserve le bleu/rouge
 *                        historique.
 *
 *  Rendu : <img> natif (PAS next/image) → balisage 100 % déterministe
 *  serveur = client, donc aucun risque de mismatch d'hydratation. Le logo
 *  fait 9 Ko : l'optimiseur next/image n'apporte rien ici.
 *
 *  Clear-space géré par le parent (marge ≈ hauteur de l'icône maison).
 *  `heightClass` contrôle la taille (défaut : 36 px de nav). Lisibilité
 *  garantie ≥ 28 px de haut.
 */
export function Logo({
  variant = "light",
  heightClass = "h-9",
  priority = false,
  className,
}: {
  variant?: "light" | "dark";
  /** Classe Tailwind de hauteur (ex. "h-7", "h-9", "h-11"). Largeur auto. */
  heightClass?: string;
  priority?: boolean;
  className?: string;
}) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO.src}
      alt={LOGO.alt}
      width={LOGO.width}
      height={LOGO.height}
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      className={cn(heightClass, "w-auto")}
    />
  );

  if (variant === "dark") {
    // Plaque crème : contraste garanti sur fond bleu/navy, couleurs préservées.
    return (
      <span className={cn("inline-grid place-items-center rounded-lg bg-creme px-3 py-2", className)}>
        {img}
      </span>
    );
  }

  return <span className={cn("inline-grid", className)}>{img}</span>;
}
