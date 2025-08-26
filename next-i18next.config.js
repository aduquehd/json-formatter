module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: [
      'en',           // English
      'es',           // Spanish  
      'hi',           // Hindi
      'tr',           // Turkish
      'nl',           // Dutch
      'ms',           // Malay
      'zh',           // Mandarin Chinese
      'ta',           // Tamil
      'fy',           // Frisian
      'nds',          // Low Saxon
      'li',           // Limburgish
    ],
    localeDetection: true,
  },
  fallbackLng: 'en',
  supportedLngs: [
    'en', 'es', 'hi', 'tr', 'nl', 
    'ms', 'zh', 'ta', 'fy', 'nds', 'li'
  ],
  ns: ['common'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
}