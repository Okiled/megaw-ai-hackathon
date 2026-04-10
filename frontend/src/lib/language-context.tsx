"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "id" | "en";

type LanguageContextType = {
  language: Language;
  locale: string;
  setLanguage: (language: Language) => void;
};

const LANGUAGE_KEY = "megaw-language";

const LanguageContext = createContext<LanguageContextType>({
  language: "id",
  locale: "id-ID",
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const storedLanguage = localStorage.getItem(LANGUAGE_KEY);
      if (storedLanguage === "id" || storedLanguage === "en") {
        return storedLanguage;
      }
    }
    return "id";
  });

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    localStorage.setItem(LANGUAGE_KEY, nextLanguage);
    document.documentElement.lang = nextLanguage;
  };

  const value = useMemo(
    () => ({
      language,
      locale: language === "en" ? "en-US" : "id-ID",
      setLanguage,
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
