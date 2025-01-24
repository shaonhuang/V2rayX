import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// Import translation files
import translationEN from './en.json';
import translationZH from './zh.json';
import translationJA from './ja.json';
import translationKO from './ko.json';
import translationRU from './ru.json';
import translationES from './es.json';
import translationFR from './fr.json';
import translationFA from './fa.json';
import translationDE from './de.json';

export const defaultLng = 'en';

const resources = {
  en: { translations: translationEN },
  zh: { translations: translationZH },
  ja: { translations: translationJA },
  ko: { translations: translationKO },
  ru: { translations: translationRU },
  es: { translations: translationES },
  fr: { translations: translationFR },
  fa: { translations: translationFA },
  de: { translations: translationDE },
};

declare module 'i18next' {
  interface CustomTypeOptions {
    defaltNS: 'en';
    resources: (typeof translations)['en'];
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // we init with resources
    resources,
    fallbackLng: defaultLng,
    debug: false,

    // have a common namespace used around the full app
    ns: ['translations'],
    defaultNS: 'translations',

    keySeparator: false, // we use content as keys

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
