'use client';

import type { ReactNode } from 'react';
import JsonWorkbench from '@/components/JsonWorkbench';
import Navbar from '@/components/Navbar';
import { useTheme } from '@/hooks/useTheme';

/**
 * Shared shell for every workbench view (`/`, `/tree`, `/diff`, …). Because a
 * layout instance persists across navigations between its child routes, the
 * <JsonWorkbench> mounted here keeps its state (editor content, options) when
 * you switch views — only the SEO `children` below it swap. The active view is
 * derived from the URL inside the workbench.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <Navbar theme={theme} onThemeToggle={toggleTheme} />

      <JsonWorkbench />

      {children}

      {/* Slim footer — full docs live on the Help page */}
      <footer className="container mx-auto px-4 py-6 border-t border-[var(--border-color)]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-sm text-[var(--text-secondary)]">
          <p className="font-mono text-xs">
            © {new Date().getFullYear()} jsonformatter.me — free, open-source JSON tools
          </p>
          <nav className="flex gap-6">
            <a href="/help" className="hover:text-[var(--accent-color)] transition-colors">
              Help &amp; Guide
            </a>
            <a href="/guides" className="hover:text-[var(--accent-color)] transition-colors">
              Guides
            </a>
            <a
              href="https://github.com/aduquehd/json-viewer"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--accent-color)] transition-colors"
            >
              GitHub
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
