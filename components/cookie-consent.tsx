"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, Shield } from "lucide-react";

const KEY = "ca-consent-v1";

type Consent = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
};

function read(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Consent;
  } catch {
    return null;
  }
}

function save(c: Consent) {
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
    // Hook futur : déclencher GA/Pixel ici si analytics === true
    window.dispatchEvent(new CustomEvent("consent-changed", { detail: c }));
  } catch {}
}

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = read();
    if (!existing) setOpen(true);
  }, []);

  const acceptAll = () => {
    save({ essential: true, analytics: true, marketing: true, decidedAt: new Date().toISOString() });
    setOpen(false);
  };
  const rejectAll = () => {
    save({ essential: true, analytics: false, marketing: false, decidedAt: new Date().toISOString() });
    setOpen(false);
  };
  const saveCustom = () => {
    save({ essential: true, analytics, marketing, decidedAt: new Date().toISOString() });
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 left-4 right-4 lg:left-6 lg:right-6 lg:bottom-6 z-[200]"
          role="dialog"
          aria-label="Préférences cookies"
        >
          <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-pierre shadow-lift overflow-hidden">
            <div className="p-5 lg:p-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-bleu/10 border border-bleu/30 grid place-items-center shrink-0">
                  <Cookie className="h-4 w-4 text-bleu" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-lg text-anthra leading-tight">
                    Cookies & confidentialité
                  </div>
                  <p className="mt-2 text-sm text-taupe leading-relaxed">
                    Nous utilisons uniquement les cookies <strong>strictement nécessaires</strong>{" "}
                    au fonctionnement du site. Les cookies de mesure d&apos;audience et marketing
                    ne sont activés qu&apos;après votre accord (RGPD · Luxembourg).
                  </p>

                  {details && (
                    <div className="mt-5 space-y-3 border-t border-pierre pt-5">
                      <Pref
                        label="Strictement nécessaires"
                        body="Sécurité, navigation, soumission de formulaires. Toujours actifs."
                        locked
                        checked
                      />
                      <Pref
                        label="Mesure d'audience (analytics)"
                        body="Statistiques de visite anonymisées. Aucune donnée commerciale."
                        checked={analytics}
                        onChange={setAnalytics}
                      />
                      <Pref
                        label="Marketing"
                        body="Mesure d'efficacité des campagnes (le cas échéant). Aucune revente."
                        checked={marketing}
                        onChange={setMarketing}
                      />
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      onClick={acceptAll}
                      className="inline-flex items-center gap-2 rounded-full bg-navy text-creme px-5 py-2.5 text-sm font-medium hover:bg-bleu transition-colors"
                    >
                      Tout accepter
                    </button>
                    <button
                      onClick={rejectAll}
                      className="inline-flex items-center gap-2 rounded-full bg-white border border-pierre text-anthra px-5 py-2.5 text-sm font-medium hover:border-pierre transition-colors"
                    >
                      Refuser non essentiels
                    </button>
                    {!details ? (
                      <button
                        onClick={() => setDetails(true)}
                        className="inline-flex items-center gap-2 text-sm text-taupe hover:text-bleu underline underline-offset-2 transition-colors px-3"
                      >
                        Personnaliser
                      </button>
                    ) : (
                      <button
                        onClick={saveCustom}
                        className="inline-flex items-center gap-2 rounded-full bg-bleu text-creme px-5 py-2.5 text-sm font-medium hover:bg-bleu-500 transition-colors"
                      >
                        Enregistrer mes choix
                      </button>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-eyebrow text-muted">
                    <Shield className="h-3 w-3 text-bleu" />
                    Conforme RGPD · Données stockées localement
                  </div>
                </div>

                <button
                  onClick={rejectAll}
                  aria-label="Fermer"
                  className="shrink-0 text-muted hover:text-anthra transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Pref({
  label,
  body,
  checked,
  onChange,
  locked,
}: {
  label: string;
  body: string;
  checked: boolean;
  onChange?: (b: boolean) => void;
  locked?: boolean;
}) {
  return (
    <label
      className={`flex items-start gap-4 p-3 rounded-xl border ${
        locked ? "border-pierre bg-creme" : "border-pierre bg-white hover:border-bleu/30"
      } cursor-${locked ? "default" : "pointer"} transition-colors`}
    >
      <div className="flex-1">
        <div className="font-medium text-anthra text-sm">{label}</div>
        <div className="mt-1 text-xs text-taupe leading-relaxed">{body}</div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={locked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-1 accent-bleu shrink-0"
      />
    </label>
  );
}
