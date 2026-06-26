"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { defaultLocale, getLocaleFromPathname, normalizeLocale, type Locale, getLocalizedPath } from "@/lib/i18n";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dir: "ltr" | "rtl";
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getInitialLocale(pathname: string): Locale {
  const pathnameLocale = getLocaleFromPathname(pathname);
  if (pathnameLocale) return pathnameLocale;
  if (typeof window !== "undefined") {
    const storageLocale = normalizeLocale(window.localStorage.getItem("preferred-locale"));
    if (storageLocale) return storageLocale;
    const navigatorLocale = normalizeLocale(window.navigator.language);
    if (navigatorLocale) return navigatorLocale;
  }
  return defaultLocale;
}

export function LocaleProvider({ children, initialLocale }: { children: React.ReactNode; initialLocale?: Locale }) {
  const pathname = usePathname();
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? defaultLocale);

  useEffect(() => {
    const resolvedLocale = initialLocale ?? getInitialLocale(pathname);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocaleState(resolvedLocale);
  }, [initialLocale, pathname]);

  useEffect(() => {
    const currentLocale = getLocaleFromPathname(pathname);
    if (!currentLocale && locale !== defaultLocale) {
      router.replace(getLocalizedPath(pathname, locale));
    }
  }, [locale, pathname, router]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    document.documentElement.classList.toggle("rtl", locale === "ar");
  }, [locale]);

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    if (typeof window === "undefined") return;
    window.localStorage.setItem("preferred-locale", nextLocale);
    const nextPath = getLocalizedPath(pathname, nextLocale);
    if (nextPath !== pathname) {
      router.replace(nextPath);
    }
  };

  const value = useMemo(() => ({ locale, setLocale, dir: (locale === "ar" ? "rtl" : "ltr") as "ltr" | "rtl" }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within LocaleProvider");
  return context;
}
