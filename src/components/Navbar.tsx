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
    <nav className="fixed top-0 left-0 right-0 h-14 bg-[var(--navbar-bg)] backdrop-blur-xl border-b border-[var(--navbar-border)] z-[1000] shadow-[var(--navbar-shadow)]">
      <div className="max-w-[1400px] mx-auto px-14 h-full flex items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-lg font-bold text-gray-600 dark:text-gray-400 tracking-tight m-0 leading-tight">
            JSON <span className="glitch-text text-blue-600 dark:text-cyan-400" data-text="Formatter">Formatter</span> & <span className="glitch-text text-purple-600 dark:text-purple-400" data-text="Viewer">Viewer</span> - Free, secure, and Open Source
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-300 m-0 font-medium tracking-tight leading-tight">
            Free JSON formatter, validator, and viewer. All processing happens
            locally in your browser—100% secure and private.
          </p>
        </div>
        
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="https://aduquehd.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-cyan-400 transition-all duration-300 hover:underline"
          >
            <Link2 className="w-4 h-4" />
            <span>Created by @aduquehd</span>
          </Link>
          
          <Link
            href="https://github.com/aduquehd/json-viewer"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <Github className="w-4 h-4" />
            <span className="github-text">Open Source</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;