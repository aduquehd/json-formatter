import { Github } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Shared shell for every page under /guides. The guide pages are content pages
 * (not the workbench), so unlike the app's client-only Navbar this header is
 * server-rendered — it stays in the SSR HTML for crawlers and gives readers a
 * way back into the tool, which the standalone guide pages previously lacked.
 */
export default function GuidesLayout({ children }: { children: ReactNode }) {
  const navLink =
    'px-3 py-1.5 rounded-full text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent-color)] hover:bg-[var(--accent-bg)] transition-colors';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
      <header className="sticky top-0 z-50 border-b border-[var(--navbar-border)] bg-[var(--navbar-bg)] backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
            aria-label="JSON Formatter home"
          >
            <span
              className="flex items-center justify-center w-9 h-9 rounded-md border border-[var(--border-color)] bg-[var(--accent-bg)] font-mono text-[var(--accent-color)] text-lg font-bold leading-none shrink-0 shadow-[0_0_18px_-7px_var(--accent-color)]"
              aria-hidden="true"
            >
              {'{ }'}
            </span>
            <span className="font-bold text-[var(--text-primary)] tracking-tight">
              JSON Formatter
            </span>
          </Link>

          <nav className="flex items-center gap-0.5 sm:gap-1">
            <Link href="/guides" className={navLink}>
              Guides
            </Link>
            <Link href="/help" className="hidden sm:inline-block">
              <span className={navLink}>Help</span>
            </Link>
            <Link
              href="https://github.com/aduquehd/json-viewer"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
              className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full text-[var(--text-secondary)] hover:text-[var(--accent-color)] hover:bg-[var(--accent-bg)] transition-colors"
            >
              <Github className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="ml-1 px-3.5 py-1.5 rounded-full text-sm font-semibold bg-[var(--accent-color)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] transition-colors"
            >
              Open Formatter
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-[var(--text-secondary)]">
          <p className="font-mono text-xs">
            © {new Date().getFullYear()} jsonformatter.me — free, open-source JSON tools
          </p>
          <nav className="flex gap-6">
            <Link href="/" className="hover:text-[var(--accent-color)] transition-colors">
              Formatter
            </Link>
            <Link href="/guides" className="hover:text-[var(--accent-color)] transition-colors">
              Guides
            </Link>
            <Link href="/help" className="hover:text-[var(--accent-color)] transition-colors">
              Help
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
