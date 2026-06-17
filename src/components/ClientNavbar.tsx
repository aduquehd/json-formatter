'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Github, HelpCircle, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

interface ClientNavbarProps {
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

const ClientNavbar: React.FC<ClientNavbarProps> = ({ theme, onThemeToggle }) => {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 h-auto bg-[var(--navbar-bg)] backdrop-blur-xl border-b border-[var(--navbar-border)] z-[1000] shadow-[var(--navbar-shadow)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-14 py-3 md:py-2 h-full flex items-center justify-between gap-2 md:gap-4">
        <div className="flex flex-col items-start gap-0.5 flex-1">
          <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-200 tracking-tight m-0 leading-tight">
            {mounted ? t('nav.title') : 'JSON Formatter, Viewer & Editor Online'}
          </h1>
          <p className="text-[9px] sm:text-xs text-gray-600 dark:text-gray-400 m-0 font-normal tracking-tight leading-tight line-clamp-1 sm:line-clamp-none">
            Free, open source, and secure. All JSON content is processed locally in your browser—no data is sent to any servers.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 min-w-fit">
          <div className="flex flex-row items-center gap-1.5 sm:gap-2">
            <Link
              href="/help"
              className="group flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-3 py-0.5 sm:py-1.5 text-[9px] sm:text-sm font-medium rounded-full border border-[var(--border-color)] bg-[var(--btn-secondary-bg)] text-[var(--text-secondary)] hover:text-[var(--accent-color)] hover:border-[var(--accent-color)] transition-colors duration-200"
              aria-label="JSON Help and Documentation"
            >
              <HelpCircle className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-[var(--accent-color)]" />
              <span className="font-semibold">{mounted ? t('nav.help') : 'Help'}</span>
              <span className="hidden sm:inline-flex ml-1 items-center justify-center text-[9px] px-1.5 py-0.5 bg-[var(--accent-color)] text-white rounded-full font-bold">NEW</span>
            </Link>
            
            <Link
              href="https://github.com/aduquehd/json-formatter"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center gap-1 sm:gap-1.5 px-1 sm:px-3 md:px-3.5 py-0.5 sm:py-1.5 md:py-2 rounded-full bg-gray-900 dark:bg-black text-white text-[10px] sm:text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-900 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 border border-gray-800 dark:border-gray-700 w-6 sm:w-auto h-6 sm:h-auto"
            >
              <Github className="w-3 h-3 sm:w-4 sm:h-4 group-hover:rotate-12 transition-transform duration-300" />
              <span className="hidden sm:inline">Open Source</span>
            </Link>
            
            {/* Language Selector - Mobile only, no label */}
            <div className="block md:hidden">
              {mounted && <LanguageSelector showLabel={false} />}
            </div>
          </div>
          
          <Link
            href="https://aduquehd.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-xs font-medium rounded-full border border-[var(--border-color)] bg-[var(--btn-secondary-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-colors duration-200"
          >
            <span className="hidden sm:inline">Made with</span>
            <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-500 dark:text-red-400 fill-current" />
            <span>by</span>
            <span className="font-semibold text-[var(--text-primary)]">@aduquehd</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default ClientNavbar;