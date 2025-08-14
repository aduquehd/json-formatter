'use client';

import React from 'react';
import Link from 'next/link';
import { Link2, Github } from 'lucide-react';

interface NavbarProps {
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ theme, onThemeToggle }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 h-auto md:h-14 bg-[var(--navbar-bg)] backdrop-blur-xl border-b border-[var(--navbar-border)] z-[1000] shadow-[var(--navbar-shadow)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-14 py-3 md:py-0 h-full flex items-center justify-between gap-3 md:gap-4">
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 dark:text-gray-200 tracking-tight m-0 leading-tight">
            JSON <span className="glitch-text text-blue-600 dark:text-cyan-400" data-text="Formatter">Formatter</span> & <span className="glitch-text text-purple-600 dark:text-purple-400" data-text="Viewer">Viewer</span><span className="hidden sm:inline"> - Online JSON Tools</span>
          </h1>
          <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 m-0 font-normal tracking-tight leading-tight">
            Free, open source, and secure. All JSON content is processed locally in your browser—no data is sent to any servers.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row items-end md:items-center gap-1 md:gap-4 min-w-[110px] sm:min-w-0">
          <Link
            href="https://aduquehd.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-cyan-400 transition-all duration-300 hover:underline"
          >
            <Link2 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Created by</span>
            <span>@aduquehd</span>
          </Link>
          
          <Link
            href="https://github.com/aduquehd/json-formatter"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full bg-black text-white text-xs sm:text-sm font-medium hover:bg-gray-800 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <Github className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="sm:hidden">Open Source</span>
            <span className="github-text hidden sm:inline">Open Source</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;