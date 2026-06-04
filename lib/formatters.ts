/**
 * Formatteurs partagés — extraits des duplications dans toutes les pages
 * admin/api. Une seule source de vérité pour les formats EUR, dates,
 * pourcentages, durées.
 *
 * Toutes les fonctions sont pures, locale FR par défaut.
 */

/** Format EUR : `1 234 €` (compact si >= 1k : `1.2 k€`, `1.5 M€`). */
export function formatEur(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1000) {
    if (Math.abs(value) >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")} M€`;
    }
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1).replace(/\.0$/, "")} k€`;
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Format date long FR : `29 mai 2026`. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

/** Format date court : `29/05/2026`. */
export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

/** Format date+heure : `29/05/2026 14:32`. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Format durée relative : `il y a 3 j`, `il y a 2 mois`. */
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const diff = Date.now() - t;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "à l'instant";
  const min = Math.floor(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `il y a ${hr} h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `il y a ${day} j`;
  const month = Math.floor(day / 30);
  if (month < 12) return `il y a ${month} mois`;
  const year = Math.floor(day / 365);
  return `il y a ${year} an${year > 1 ? "s" : ""}`;
}

/** Durée en minutes → `2 h 15`, `45 min`. */
export function formatMinutes(min: number): string {
  if (!Number.isFinite(min) || min < 0) return "—";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m.toString().padStart(2, "0")}`;
}

/** Format pourcentage : `42 %`, `42.5 %` selon decimals. */
export function formatPercent(ratio: number, decimals = 0): string {
  if (!Number.isFinite(ratio)) return "—";
  return `${(ratio * 100).toFixed(decimals)} %`;
}

/** Format nombre avec séparateurs : `1 234`. */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n);
}
