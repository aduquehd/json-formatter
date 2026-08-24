'use client';

import { Check, ChevronDown, Globe } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { canonicalLanguage, languages } from '@/lib/i18n';
import { writeStored } from '@/utils/safeStorage';

interface LanguageSelectorProps {
  showLabel?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ showLabel = false }) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // `resolvedLanguage` is the bundle actually in use, which is what the checkmark should
  // track; `i18n.language` can keep a raw region tag when `changeLanguage` is called with
  // one directly. `canonicalLanguage` then folds script aliases (e.g. 'zh-Hans') onto the
  // code the `languages` list actually holds, so the checkmark never falls back to English.
  const activeLanguage = canonicalLanguage(i18n.resolvedLanguage || i18n.language);
  const currentLanguage = languages.find((lang) => lang.code === activeLanguage) || languages[0];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    writeStored('i18nextLng', languageCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 ${showLabel ? 'px-3 py-1.5' : 'justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10'} rounded-lg bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover)] transition-all duration-300`}
        aria-label="Select language"
      >
        <Globe className={showLabel ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5'} />
        {showLabel && (
          <>
            <span className="text-sm font-medium">
              {mounted ? t('buttons.language') : 'Language'}
            </span>
            <ChevronDown className="w-3 h-3" />
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.name}</span>
                </div>
                {currentLanguage.code === lang.code && (
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
