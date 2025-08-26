'use client';

import dynamic from 'next/dynamic';

const ClientNavbar = dynamic(
  () => import('./ClientNavbar'),
  { 
    ssr: false,
    loading: () => (
      <nav className="fixed top-0 left-0 right-0 h-auto bg-[var(--navbar-bg)] backdrop-blur-xl border-b border-[var(--navbar-border)] z-[1000] shadow-[var(--navbar-shadow)]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-14 py-3 md:py-2 h-full flex items-center justify-between gap-2 md:gap-4">
          <div className="flex flex-col items-start gap-0.5 flex-1">
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-200 tracking-tight m-0 leading-tight">
              JSON Viewer & Formatter
            </h1>
            <p className="text-[9px] sm:text-xs text-gray-600 dark:text-gray-400 m-0 font-normal tracking-tight leading-tight">
              Free, open source, and secure. All JSON content is processed locally in your browser—no data is sent to any servers.
            </p>
          </div>
        </div>
      </nav>
    )
  }
);

interface NavbarProps {
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

const Navbar: React.FC<NavbarProps> = (props) => {
  return <ClientNavbar {...props} />;
};

export default Navbar;