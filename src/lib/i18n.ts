import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import enTranslations from '@/locales/en/common.json';
import esTranslations from '@/locales/es/common.json';
import fyTranslations from '@/locales/fy/common.json';
import hiTranslations from '@/locales/hi/common.json';
import liTranslations from '@/locales/li/common.json';
import msTranslations from '@/locales/ms/common.json';
import ndsTranslations from '@/locales/nds/common.json';
import nlTranslations from '@/locales/nl/common.json';
import taTranslations from '@/locales/ta/common.json';
import trTranslations from '@/locales/tr/common.json';
import zhTranslations from '@/locales/zh/common.json';
import zhCNTranslations from '@/locales/zh-CN/common.json';

export const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'zh-CN', name: '中文 (简体)', flag: '🇨🇳' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'ms', name: 'Bahasa Melayu', flag: '🇸🇬' },
  { code: 'zh', name: '中文 (繁體)', flag: '🇹🇼' },
  { code: 'ta', name: 'தமிழ்', flag: '🇸🇬' },
  { code: 'fy', name: 'Frysk', flag: '🇳🇱' },
  { code: 'nds', name: 'Plattdüütsch', flag: '🇳🇱' },
  { code: 'li', name: 'Limburgs', flag: '🇳🇱' },
];

export const defaultLanguage = 'en';

// Chinese needs explicit script/region aliases. The bare `zh` bundle is Traditional,
// so without these a Simplified-script navigator ('zh-Hans', 'zh-SG') would fall back
// to `zh` and get Traditional — the same mix-up that `load: 'languageOnly'` used to
// cause for 'zh-CN'. Each alias maps to the canonical code whose bundle it should use.
const languageAliases: Record<string, string> = {
  'zh-Hans': 'zh-CN',
  'zh-SG': 'zh-CN',
  'zh-Hant': 'zh',
};

/**
 * Collapse an alias tag onto the canonical language code the `languages` list knows
 * about, so UI that matches against that list (e.g. the selector's checkmark) does not
 * fall through to English when i18next resolved an alias bundle.
 */
export function canonicalLanguage(code: string | undefined): string {
  if (!code) return defaultLanguage;
  return languageAliases[code] ?? code;
}

const resources = {
  en: { translation: enTranslations },
  es: { translation: esTranslations },
  hi: { translation: hiTranslations },
  tr: { translation: trTranslations },
  nl: { translation: nlTranslations },
  ms: { translation: msTranslations },
  'zh-CN': { translation: zhCNTranslations },
  'zh-Hans': { translation: zhCNTranslations },
  'zh-SG': { translation: zhCNTranslations },
  zh: { translation: zhTranslations },
  'zh-Hant': { translation: zhTranslations },
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
      },
      // No `load: 'languageOnly'`: that stripped the region tag, so 'zh-CN' (Simplified)
      // resolved to the 'zh' bundle (Traditional). With the default `load`, i18next matches
      // the full tag first and only then falls back to the base language, so 'zh-CN' gets its
      // own bundle while 'zh-TW'/'es-MX'/'en-GB' still resolve to 'zh'/'es'/'en'.
      supportedLngs: [
        'en',
        'es',
        'hi',
        'tr',
        'nl',
        'ms',
        'zh-CN',
        'zh-Hans',
        'zh-SG',
        'zh',
        'zh-Hant',
        'ta',
        'fy',
        'nds',
        'li',
      ],
    });
}

// Make i18n available on window for dynamic content
if (typeof window !== 'undefined') {
  (window as any).i18n = i18n;
}

export default i18n;
