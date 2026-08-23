'use client';

import type React from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

interface I18nProviderProps {
  children: React.ReactNode;
}

// Language detection lives entirely in `@/lib/i18n` (LanguageDetector with
// order: ['localStorage', 'navigator', 'htmlTag']), which runs at module init.
// Don't re-implement it here — a second, divergent detector is how 'zh-CN' got lost.
const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};

export default I18nProvider;
