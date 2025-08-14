'use client';

import React from 'react';
import { 
  Code2, 
  Minimize2, 
  Copy, 
  Clipboard, 
  Trash2, 
  FileJson, 
  Moon, 
  Sun 
} from 'lucide-react';

interface ControlButtonsProps {
  onFormat: () => void;
  onCompact: () => void;
  onClear: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onExampleClick: () => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

const ControlButtons: React.FC<ControlButtonsProps> = ({
  onFormat,
  onCompact,
  onClear,
  onCopy,
  onPaste,
  onExampleClick,
  theme,
  onThemeToggle,
}) => {
  return (
    <div className="flex items-center justify-between w-full gap-3">
      <div className="flex gap-1.5 flex-wrap items-center flex-1">
        <button onClick={onFormat} className="btn btn-accent">
          <Code2 className="w-4 h-4" />
          Format JSON
        </button>
        
        <button onClick={onCompact} className="btn btn-purple">
          <Minimize2 className="w-4 h-4" />
          Compact JSON
        </button>
        
        <button onClick={onCopy} className="btn btn-secondary">
          <Copy className="w-4 h-4" />
          Copy
        </button>
        
        <button onClick={onPaste} className="btn btn-secondary">
          <Clipboard className="w-4 h-4" />
          Paste
        </button>
        
        <button onClick={onClear} className="btn btn-secondary">
          <Trash2 className="w-4 h-4" />
          Clear
        </button>
      </div>
      
      <button
        onClick={onExampleClick}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
      >
        <FileJson className="w-4 h-4" />
        <span className="hidden sm:inline">Use an example JSON</span>
      </button>
      
      <button
        onClick={onThemeToggle}
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover)] transition-all duration-300"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};

export default ControlButtons;