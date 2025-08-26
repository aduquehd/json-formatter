'use client';

import React, { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

interface I18nProviderProps {
  children: React.ReactNode;
}

const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  useEffect(() => {
    // Check if there's a saved language preference
    const savedLanguage = localStorage.getItem('i18nextLng');
    
    if (savedLanguage) {
      // Use saved language if it exists
      if (savedLanguage !== i18n.language) {
        i18n.changeLanguage(savedLanguage);
      }
    } else {
      // No saved language, detect from browser
      const browserLang = navigator.language || navigator.languages?.[0] || 'en';
      // Extract the language code (e.g., 'zh' from 'zh-CN')
      const langCode = browserLang.split('-')[0];
      
      // Check if we support this language
      const supportedLangs = ['en', 'es', 'hi', 'tr', 'nl', 'ms', 'zh', 'ta', 'fy', 'nds', 'li'];
      const languageToUse = supportedLangs.includes(langCode) ? langCode : 'en';
      
      if (languageToUse !== i18n.language) {
        i18n.changeLanguage(languageToUse);
      }
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};

export default I18nProvider;