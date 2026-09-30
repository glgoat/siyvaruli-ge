import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { translations, type Language, type TranslationKey } from '@/constants/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'ka', setLang: () => {}, t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('ka');

  useEffect(() => {
    AsyncStorage.getItem('siyvaruli-lang').then((stored) => {
      if (stored === 'en' || stored === 'ka') setLangState(stored);
    });
  }, []);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    AsyncStorage.setItem('siyvaruli-lang', newLang);
  }, []);

  const t = useCallback((key: TranslationKey) => {
    return translations[lang][key] ?? translations.en[key] ?? key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
