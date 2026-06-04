"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  type Locale,
  DEFAULT_LOCALE,
  COOKIE_NAME,
  LOCALES,
  getDictionary,
} from "@/lib/i18n";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: ReturnType<typeof getDictionary>;
};

const I18nContext = createContext<Ctx | null>(null);

function readCookie(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const match = document.cookie.match(new RegExp(`${COOKIE_NAME}=(\\w+)`));
  const v = match?.[1] as Locale | undefined;
  return v && LOCALES.includes(v) ? v : DEFAULT_LOCALE;
}

function writeCookie(locale: Locale) {
  if (typeof document === "undefined") return;
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE_NAME}=${locale}; path=/; max-age=${oneYear}; SameSite=Lax`;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Au montage : on lit le cookie (évite hydration mismatch)
  useEffect(() => {
    setLocaleState(readCookie());
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    writeCookie(l);
    document.documentElement.lang = l;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: getDictionary(locale) }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fallback safe — utile si un composant client est utilisé hors du provider
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: getDictionary(DEFAULT_LOCALE),
    };
  }
  return ctx;
}
