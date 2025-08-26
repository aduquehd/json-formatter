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
            {mounted ? t('nav.title') : 'JSON Viewer & Formatter'}
          </h1>
          <p className="text-[9px] sm:text-xs text-gray-600 dark:text-gray-400 m-0 font-normal tracking-tight leading-tight">
            Free, open source, and secure. All JSON content is processed locally in your browser—no data is sent to any servers.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 min-w-fit">
          <div className="flex flex-row items-center gap-1.5 sm:gap-2">
            <Link
              href="/help"
              className="group relative flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-3 py-0.5 sm:py-1.5 text-[9px] sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/40 dark:hover:to-purple-900/40 rounded-full transition-all duration-300 hover:shadow-lg hover:scale-105 border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-400 dark:hover:border-blue-600"
              aria-label="JSON Help and Documentation"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-10 rounded-full transition-opacity duration-300" />
              <HelpCircle className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-all duration-300 group-hover:rotate-12" />
              <span className="relative font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-purple-700 dark:group-hover:from-blue-300 dark:group-hover:to-purple-300">
                {mounted ? t('nav.help') : 'Help'}
              </span>
              <span className="hidden sm:inline-flex ml-1 items-center justify-center text-[9px] px-1.5 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-bold animate-pulse shadow-sm">NEW</span>
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
            className="group relative flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-xs font-medium text-gray-700 dark:text-gray-300 bg-gradient-to-r from-pink-50 to-red-50 dark:from-pink-950/30 dark:to-red-950/30 hover:from-pink-100 hover:to-red-100 dark:hover:from-pink-900/40 dark:hover:to-red-900/40 rounded-full transition-all duration-300 hover:shadow-lg hover:scale-105 border border-pink-200/50 dark:border-pink-800/50 hover:border-pink-400 dark:hover:border-pink-600"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-red-400 opacity-0 group-hover:opacity-10 rounded-full transition-opacity duration-300" />
            <span className="hidden sm:inline relative">Made with</span>
            <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-500 dark:text-red-400 fill-current group-hover:scale-110 transition-transform relative" />
            <span className="relative">by</span>
            <span className="relative font-semibold bg-gradient-to-r from-pink-600 to-red-600 dark:from-pink-400 dark:to-red-400 bg-clip-text text-transparent group-hover:from-pink-700 group-hover:to-red-700 dark:group-hover:from-pink-300 dark:group-hover:to-red-300">@aduquehd</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default ClientNavbar;