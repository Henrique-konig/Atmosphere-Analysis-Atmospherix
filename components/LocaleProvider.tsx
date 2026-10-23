"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { detectLocale, isLocale, localeTag, setLocale, type Locale } from "@/lib/i18n";
import { loadLocale, storeLocale } from "@/lib/storage";

const LocaleContext = createContext<{ locale: Locale; change: (locale: Locale) => void }>({
  locale: "pt",
  change: () => {},
});

function initialLocale(): Locale {
  const stored = loadLocale();
  return isLocale(stored) ? stored : detectLocale(navigator.languages ?? [navigator.language]);
}

/** Holds the interface language; components that read it re-render when it changes. */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setState] = useState<Locale>(() => {
    const first = initialLocale();
    setLocale(first);
    return first;
  });

  const change = useCallback((next: Locale) => {
    setLocale(next);
    storeLocale(next);
    setState(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = localeTag(locale);
  }, [locale]);

  return <LocaleContext.Provider value={{ locale, change }}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => useContext(LocaleContext);
