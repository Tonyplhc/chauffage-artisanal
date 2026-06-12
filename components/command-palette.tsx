"use client";

/**
 * Command Palette globale — ouverture Ctrl+K / Cmd+K.
 *
 * Affiche les résultats de recherche dans l'index public (lib/search-index.ts).
 * Sur la zone admin, ajoute aussi la recherche dans les leads (call API).
 *
 * Navigation au clavier : ↑↓ pour bouger, Enter pour ouvrir, Esc pour fermer.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ArrowRight,
  Hash,
  X as XIcon,
  CommandIcon,
  Flame,
  Snowflake,
  Droplets,
  Sun,
  ShieldCheck,
  Leaf,
  Newspaper,
  MapPin,
  FileText,
  Wrench,
  Phone,
  HandCoins,
  Sparkles,
  Briefcase,
  Building2,
  Mail,
  MessageCircle,
  Activity,
  Receipt,
} from "lucide-react";
import {
  PUBLIC_SEARCH_INDEX,
  searchEntries,
  type SearchEntry,
} from "@/lib/search-index";

const ICON_FOR_HREF: Record<string, typeof Flame> = {
  "/chauffage": Flame,
  "/pompes-a-chaleur": Leaf,
  "/climatisation": Snowflake,
  "/sanitaire": Droplets,
  "/energies-renouvelables": Sun,
  "/entretien": ShieldCheck,
  "/depannage": Wrench,
  "/primes-aides": HandCoins,
  "/savoir-faire": Sparkles,
  "/realisations": FileText,
  "/recrutement": Briefcase,
  "/a-propos": Building2,
  "/contact": Phone,
  "/devis": FileText,
  "/zones": MapPin,
  "/actualites": Newspaper,
};

function iconFor(entry: SearchEntry) {
  if (entry.href.startsWith("/zones/")) return MapPin;
  if (entry.href.startsWith("/actualites/")) return Newspaper;
  return ICON_FOR_HREF[entry.href] ?? Hash;
}

type AdminLead = {
  reference: string;
  fullName: string;
  email: string;
  commune: string;
  services: string[];
};

type DeepHit = {
  type: "lead" | "chat" | "activity" | "quote" | "article";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  score: number;
};

const DEEP_ICONS: Record<DeepHit["type"], typeof Hash> = {
  lead: Mail,
  chat: MessageCircle,
  activity: Activity,
  quote: Receipt,
  article: Newspaper,
};

const DEEP_LABELS: Record<DeepHit["type"], string> = {
  lead: "Lead",
  chat: "Chat",
  activity: "Activité",
  quote: "Devis",
  article: "Article",
};

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [adminLeads, setAdminLeads] = useState<AdminLead[]>([]);
  const [deepHits, setDeepHits] = useState<DeepHit[]>([]);
  const [deepBusy, setDeepBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAdminContext = pathname?.startsWith("/admin");

  // Ctrl+K / Cmd+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Focus input à l'ouverture, reset query à la fermeture
  useEffect(() => {
    if (open) {
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
      document.body.style.overflow = "hidden";
    } else {
      setQuery("");
      document.body.style.overflow = "";
    }
  }, [open]);

  // Charger leads admin si on est en zone admin
  useEffect(() => {
    if (!open || !isAdminContext) return;
    fetch("/api/admin/leads", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.leads) {
          setAdminLeads(
            data.leads.map((l: AdminLead) => ({
              reference: l.reference,
              fullName: l.fullName,
              email: l.email,
              commune: l.commune,
              services: l.services,
            })),
          );
        }
      })
      .catch(() => {});
  }, [open, isAdminContext]);

  // Recherche profonde admin (debounce 300ms) — leads/chat/activité/devis/articles
  useEffect(() => {
    if (!open || !isAdminContext) {
      setDeepHits([]);
      return;
    }
    const q = query.trim();
    if (q.length < 2) {
      setDeepHits([]);
      return;
    }
    let cancelled = false;
    setDeepBusy(true);
    const t = setTimeout(() => {
      fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (cancelled) return;
          setDeepHits(Array.isArray(data?.hits) ? data.hits : []);
        })
        .catch(() => {
          if (!cancelled) setDeepHits([]);
        })
        .finally(() => {
          if (!cancelled) setDeepBusy(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open, isAdminContext, query]);

  // Résultats publics
  const publicResults = useMemo(() => {
    if (!query.trim()) {
      // Sans query, suggère les pages les plus utiles
      return PUBLIC_SEARCH_INDEX.slice(0, 8).map((entry) => ({
        entry,
        score: 0,
      }));
    }
    return searchEntries(query, PUBLIC_SEARCH_INDEX);
  }, [query]);

  // Résultats leads (filtrage local sur ce qu'on a déjà chargé)
  const leadResults = useMemo(() => {
    if (!isAdminContext || !query.trim()) return [];
    const q = query.toLowerCase();
    return adminLeads
      .filter(
        (l) =>
          l.fullName.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.reference.toLowerCase().includes(q) ||
          l.commune.toLowerCase().includes(q) ||
          l.services.some((s) => s.includes(q)),
      )
      .slice(0, 8);
  }, [isAdminContext, query, adminLeads]);

  // Dédoublonnage : on retire des deepHits les leads déjà présents dans leadResults
  const filteredDeepHits = useMemo(() => {
    if (!deepHits.length) return [];
    const localLeadRefs = new Set(leadResults.map((l) => l.reference));
    return deepHits.filter(
      (h) => !(h.type === "lead" && localLeadRefs.has(h.id)),
    );
  }, [deepHits, leadResults]);

  // Liste plate pour navigation clavier
  type FlatItem =
    | { kind: "page"; entry: SearchEntry }
    | { kind: "lead"; lead: AdminLead }
    | { kind: "deep"; hit: DeepHit };
  const flat: FlatItem[] = useMemo(() => {
    const out: FlatItem[] = [];
    for (const r of publicResults) out.push({ kind: "page", entry: r.entry });
    for (const l of leadResults) out.push({ kind: "lead", lead: l });
    for (const h of filteredDeepHits) out.push({ kind: "deep", hit: h });
    return out;
  }, [publicResults, leadResults, filteredDeepHits]);

  const goTo = useCallback(
    (item: FlatItem) => {
      setOpen(false);
      if (item.kind === "page") {
        router.push(item.entry.href);
      } else if (item.kind === "lead") {
        router.push(`/admin/leads/${item.lead.reference}`);
      } else {
        router.push(item.hit.href);
      }
    },
    [router],
  );

  // Navigation clavier
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(flat.length - 1, a + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = flat[active];
        if (item) goTo(item);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, flat, active, goTo]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[90] bg-navy/40 backdrop-blur-sm grid place-items-start pt-[10vh] px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <motion.div
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-2xl bg-white rounded-2xl border border-pierre shadow-lift overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-pierre">
              <Search className="h-5 w-5 text-taupe shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder={
                  isAdminContext
                    ? "Rechercher pages, leads, communes…"
                    : "Rechercher pages, services, articles…"
                }
                className="flex-1 bg-transparent text-anthra placeholder:text-muted focus:outline-none"
              />
              <button
                onClick={() => setOpen(false)}
                className="h-7 w-7 grid place-items-center rounded-full bg-creme border border-pierre text-taupe hover:bg-navy hover:text-creme transition-colors"
                aria-label="Fermer"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {flat.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm text-muted">
                  Aucun résultat pour «&nbsp;{query}&nbsp;».
                </div>
              ) : (
                <>
                  {publicResults.length > 0 && (
                    <Section title="Navigation">
                      {publicResults.map((r, i) => {
                        const flatIdx = i;
                        const Icon = iconFor(r.entry);
                        return (
                          <Item
                            key={r.entry.href}
                            active={active === flatIdx}
                            onMouseEnter={() => setActive(flatIdx)}
                            onClick={() => goTo({ kind: "page", entry: r.entry })}
                            icon={<Icon className="h-4 w-4 text-bleu" />}
                            title={r.entry.title}
                            subtitle={r.entry.description}
                            badge={r.entry.badge}
                          />
                        );
                      })}
                    </Section>
                  )}
                  {leadResults.length > 0 && (
                    <Section title={`Leads (${leadResults.length})`}>
                      {leadResults.map((l, i) => {
                        const flatIdx = publicResults.length + i;
                        return (
                          <Item
                            key={l.reference}
                            active={active === flatIdx}
                            onMouseEnter={() => setActive(flatIdx)}
                            onClick={() => goTo({ kind: "lead", lead: l })}
                            icon={<Mail className="h-4 w-4 text-bleu" />}
                            title={l.fullName}
                            subtitle={`${l.reference} · ${l.commune} · ${l.services.join(" · ")}`}
                            badge="Lead"
                          />
                        );
                      })}
                    </Section>
                  )}
                  {filteredDeepHits.length > 0 && (
                    <Section
                      title={`Recherche profonde${deepBusy ? " · …" : ""} (${filteredDeepHits.length})`}
                    >
                      {filteredDeepHits.map((h, i) => {
                        const flatIdx =
                          publicResults.length + leadResults.length + i;
                        const Icon = DEEP_ICONS[h.type];
                        return (
                          <Item
                            key={`${h.type}-${h.id}-${i}`}
                            active={active === flatIdx}
                            onMouseEnter={() => setActive(flatIdx)}
                            onClick={() => goTo({ kind: "deep", hit: h })}
                            icon={<Icon className="h-4 w-4 text-bleu" />}
                            title={h.title}
                            subtitle={h.subtitle}
                            badge={DEEP_LABELS[h.type]}
                          />
                        );
                      })}
                    </Section>
                  )}
                </>
              )}
            </div>

            {/* Footer hints */}
            <div className="px-4 py-2.5 border-t border-pierre bg-creme/40 flex items-center justify-between text-[10px] font-mono uppercase tracking-eyebrow text-muted">
              <span className="inline-flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd> Naviguer
                </span>
                <span className="inline-flex items-center gap-1">
                  <Kbd>↵</Kbd> Ouvrir
                </span>
                <span className="inline-flex items-center gap-1">
                  <Kbd>Esc</Kbd> Fermer
                </span>
              </span>
              <span className="inline-flex items-center gap-1">
                <CommandIcon className="h-3 w-3" />
                Recherche universelle
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2">
      <div className="px-3 py-2 font-mono text-[10px] uppercase tracking-eyebrow text-muted">
        {title}
      </div>
      <div className="grid">{children}</div>
    </div>
  );
}

function Item({
  active,
  onMouseEnter,
  onClick,
  icon,
  title,
  subtitle,
  badge,
}: {
  active: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
}) {
  return (
    <button
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-colors ${
        active ? "bg-creme" : "hover:bg-creme/60"
      }`}
    >
      <span className="h-9 w-9 rounded-lg bg-white border border-pierre grid place-items-center shrink-0">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-anthra truncate">{title}</div>
        <div className="text-xs text-muted truncate">{subtitle}</div>
      </div>
      {badge && (
        <span className="font-mono text-[10px] uppercase tracking-eyebrow text-taupe bg-white border border-pierre px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      <ArrowRight
        className={`h-3.5 w-3.5 transition-opacity ${active ? "text-bleu opacity-100" : "opacity-0"}`}
      />
    </button>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded bg-white border border-pierre text-anthra font-mono text-[10px]">
      {children}
    </kbd>
  );
}
