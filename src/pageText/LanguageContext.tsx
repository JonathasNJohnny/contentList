import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { appText, type AppLanguage } from "./appText";

const languageStorageKey = "contentList.language";

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  toggleLanguage: () => void;
  text: (typeof appText)[AppLanguage];
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLanguage(): AppLanguage {
  const savedLanguage = localStorage.getItem(languageStorageKey);

  return savedLanguage === "en" || savedLanguage === "ptBR"
    ? savedLanguage
    : "ptBR";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(getInitialLanguage);

  function setLanguage(nextLanguage: AppLanguage) {
    setLanguageState(nextLanguage);
    localStorage.setItem(languageStorageKey, nextLanguage);
  }

  function toggleLanguage() {
    setLanguage(language === "ptBR" ? "en" : "ptBR");
  }

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      text: appText[language],
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider.");
  }

  return context;
}
