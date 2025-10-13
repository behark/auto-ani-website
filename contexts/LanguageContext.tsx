"use client";

import { createContext, ReactNode, useContext, useState } from "react";

import { Language, translations } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("sq"); // Default to Albanian

  // Simple function to get nested translation values
  const t = (key: string): string => {
    const keys = key.split(".");
    let value: Record<string, unknown> | string = translations[language];

    for (const k of keys) {
      if (typeof value === "object" && value !== null && k in value) {
        value = value[k] as Record<string, unknown> | string;
      } else {
        return key; // Return key if translation not found
      }
    }

    return typeof value === "string" ? value : key; // Return key if translation not found
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
