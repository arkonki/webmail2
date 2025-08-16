import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';

// Statically import all available translations. This is the most robust method for environments
// without a complex build setup that can handle dynamic imports of JSON.
import en from './en.json';
import et from './et.json';

type Language = 'en' | 'et';
type TranslationKeys = Record<string, any>;

// A mapping of language codes to their translation objects.
const translations: Record<Language, TranslationKeys> = {
  en,
  et,
};

// Type for the translation function's replacement values.
type Replacements = Record<string, string | number>;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: Replacements) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * A simple helper function to safely access nested properties from an object using a dot-notation string.
 * @param obj The object to search within.
 * @param path The dot-notation path (e.g., 'common.save').
 * @returns The value if found, otherwise undefined.
 */
const getNestedValue = (obj: TranslationKeys, path: string): string | undefined => {
  return path.split('.').reduce((acc, key) => acc && acc[key], obj) as string | undefined;
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLang = localStorage.getItem('language');
    // Ensure the saved language is one of the available languages.
    return savedLang === 'en' || savedLang === 'et' ? savedLang : 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    localStorage.setItem('language', lang);
    setLanguageState(lang);
  }, []);

  const t = useCallback((key: string, replacements?: Replacements): string => {
    const currentTranslations = translations[language];
    
    // Look up the translation string from the current language's JSON object.
    let translation = getNestedValue(currentTranslations, key);

    if (translation === undefined) {
      // As a fallback, try to find the string in the default English translations.
      translation = getNestedValue(translations.en, key);
      if (translation === undefined) {
        console.warn(`Translation not found for key: "${key}" in language "${language}" or default "en".`);
        return key; // Return the key itself if no translation is found anywhere.
      }
    }

    // If replacements are provided, substitute them into the string.
    if (replacements) {
      return Object.entries(replacements).reduce((acc, [k, v]) => {
        const regex = new RegExp(`{{${k}}}`, 'g');
        return acc.replace(regex, String(v));
      }, translation);
    }

    return translation;
  }, [language]);

  // Memoize the context value to prevent unnecessary re-renders of consumers.
  const contextValue = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
