'use client';

import React, { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

// This version ALWAYS prioritizes browser language over saved preference
const I18nProviderBrowserFirst: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // ALWAYS detect from browser first
    const browserLang = navigator.language || navigator.languages?.[0] || 'en';
    const langCode = browserLang.split('-')[0];
    
    const supportedLangs = ['en', 'es', 'hi', 'tr', 'nl', 'ms', 'zh', 'ta', 'fy', 'nds', 'li'];
    const languageToUse = supportedLangs.includes(langCode) ? langCode : 'en';
    
    if (languageToUse !== i18n.language) {
      i18n.changeLanguage(languageToUse);
      // Don't save to localStorage - always use browser preference
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};

export default I18nProviderBrowserFirst;