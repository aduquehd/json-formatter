'use client';

import { Github, Heart, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import type React from 'react';
import { useEffect, useState } from 'react';
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
        <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
          <div
            className="hidden sm:flex items-center justify-center w-9 h-9 rounded-md border border-[var(--border-color)] bg-[var(--accent-bg)] font-mono text-[var(--accent-color)] text-lg font-bold leading-none shrink-0 shadow-[0_0_18px_-7px_var(--accent-color)]"
            aria-hidden="true"
          >
            {'{ }'}
          </div>
          <div className="flex flex-col items-start gap-0.5 min-w-0">
            {/* Site wordmark — a brand label, not the page heading (each page
                owns its own <h1>), so this stays a div to avoid duplicate h1s. */}
            <div className="text-base sm:text-lg md:text-xl font-bold text-[var(--text-primary)] tracking-tight m-0 leading-tight">
              {mounted ? t('nav.title') : 'JSON Formatter, Viewer & Editor Online'}
            </div>
            <p className="text-[9px] sm:text-xs text-[var(--text-secondary)] m-0 font-normal tracking-tight leading-tight line-clamp-1 sm:line-clamp-none">
              Free, open source &amp; secure — all processing happens locally in your browser.
            </p>
          </div>
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
              <span className="hidden sm:inline-flex ml-1 items-center justify-center text-[9px] px-1.5 py-0.5 bg-[var(--accent-color)] text-white rounded-full font-bold">
                NEW
              </span>
            </Link>

            <Link
              href="https://github.com/aduquehd/json-formatter"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center gap-1.5 px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--btn-secondary-bg)] text-[var(--text-secondary)] text-[10px] sm:text-sm font-medium hover:text-[var(--accent-color)] hover:border-[var(--border-hover)] transition-colors duration-200 w-6 sm:w-auto h-6 sm:h-auto"
            >
              <Github className="w-3 h-3 sm:w-4 sm:h-4" />
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
