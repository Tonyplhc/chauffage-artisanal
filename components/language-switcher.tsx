"use client";

import { useState } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/components/i18n-provider";
import { LOCALES, LOCALE_LABELS, LOCALE_FLAGS } from "@/lib/i18n";

export function LanguageSwitcher({
  variant = "default",
}: {
  variant?: "default" | "minimal";
}) {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={
          variant === "minimal"
            ? "inline-flex items-center gap-1.5 text-xs text-taupe hover:text-anthra transition-colors"
            : "inline-flex items-center gap-1.5 rounded-full border border-pierre bg-white px-3 py-1.5 text-xs text-taupe hover:border-bleu/40 transition-colors"
        }
        aria-label="Switch language"
        aria-expanded={open}
      >
        <Globe className="h-3.5 w-3.5" />
        <span className="font-mono uppercase">{locale}</span>
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <button
              onClick={() => setOpen(false)}
              aria-hidden
              className="fixed inset-0 z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-44 rounded-2xl bg-white border border-pierre shadow-lift py-1 z-50"
            >
              {LOCALES.map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setLocale(l);
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-creme transition-colors"
                >
                  <span className="text-base leading-none">{LOCALE_FLAGS[l]}</span>
                  <span className="flex-1 text-anthra">{LOCALE_LABELS[l]}</span>
                  {locale === l && <Check className="h-3.5 w-3.5 text-bleu" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
