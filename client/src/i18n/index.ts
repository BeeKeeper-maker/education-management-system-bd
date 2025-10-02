import en from './locales/en.json';
import bn from './locales/bn.json';
import ar from './locales/ar.json';

export type Language = 'en' | 'bn' | 'ar';

export interface Translations {
  [key: string]: string | Translations;
}

const translations: Record<Language, Translations> = {
  en,
  bn,
  ar,
};

let currentLanguage: Language = 'en';

export function setLanguage(lang: Language) {
  currentLanguage = lang;
  localStorage.setItem('language', lang);
  
  // Set document direction for RTL languages
  if (lang === 'ar') {
    document.documentElement.setAttribute('dir', 'rtl');
  } else {
    document.documentElement.setAttribute('dir', 'ltr');
  }
}

export function getLanguage(): Language {
  const stored = localStorage.getItem('language') as Language;
  return stored || 'en';
}

export function t(key: string, params?: Record<string, string>): string {
  const keys = key.split('.');
  let value: any = translations[currentLanguage];

  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }

  if (typeof value !== 'string') {
    return key;
  }

  // Replace parameters
  if (params) {
    Object.keys(params).forEach((param) => {
      value = value.replace(`{${param}}`, params[param]);
    });
  }

  return value;
}

// Initialize language on load
const savedLang = getLanguage();
setLanguage(savedLang);