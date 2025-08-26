import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from '@/locales/en/common.json';
import esTranslations from '@/locales/es/common.json';
import hiTranslations from '@/locales/hi/common.json';
import trTranslations from '@/locales/tr/common.json';
import nlTranslations from '@/locales/nl/common.json';
import msTranslations from '@/locales/ms/common.json';
import zhCNTranslations from '@/locales/zh-CN/common.json';
import zhTranslations from '@/locales/zh/common.json';
import taTranslations from '@/locales/ta/common.json';
import fyTranslations from '@/locales/fy/common.json';
import ndsTranslations from '@/locales/nds/common.json';
import liTranslations from '@/locales/li/common.json';

export const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'zh-CN', name: '中文 (简体)', flag: '🇨🇳' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'ms', name: 'Bahasa Melayu', flag: '🇸🇬' },
  { code: 'zh', name: '中文 (新加坡)', flag: '🇸🇬' },
  { code: 'ta', name: 'தமிழ்', flag: '🇸🇬' },
  { code: 'fy', name: 'Frysk', flag: '🇳🇱' },
  { code: 'nds', name: 'Plattdüütsch', flag: '🇳🇱' },
  { code: 'li', name: 'Limburgs', flag: '🇳🇱' },
];

export const defaultLanguage = 'en';

const resources = {
  en: { translation: enTranslations },
  es: { translation: esTranslations },
  hi: { translation: hiTranslations },
  tr: { translation: trTranslations },
  nl: { translation: nlTranslations },
  ms: { translation: msTranslations },
  'zh-CN': { translation: zhCNTranslations },
  zh: { translation: zhTranslations },
  ta: { translation: taTranslations },
  fy: { translation: fyTranslations },
  nds: { translation: ndsTranslations },
  li: { translation: liTranslations },
};

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: defaultLanguage,
      debug: false,
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
        lookupLocalStorage: 'i18nextLng',
        lookupFromPathIndex: 0,
        lookupFromSubdomainIndex: 0,
      },
      supportedLngs: ['en', 'es', 'hi', 'tr', 'nl', 'ms', 'zh-CN', 'zh', 'ta', 'fy', 'nds', 'li'],
      load: 'languageOnly', // This will treat 'zh-CN' as 'zh'
    });
}

// Make i18n available on window for dynamic content
if (typeof window !== 'undefined') {
  (window as any).i18n = i18n;
}

export default i18n;