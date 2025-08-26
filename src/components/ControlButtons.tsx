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
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

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
  const { t } = useTranslation();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-2 sm:gap-3">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-1.5 items-stretch sm:items-center flex-1 w-full sm:w-auto">
        <div className="flex gap-1 sm:gap-1.5 items-center">
          <button onClick={onFormat} className="btn btn-accent text-xs sm:text-sm flex-1 sm:flex-initial">
            <Code2 className="w-3 h-3 sm:w-4 sm:h-4" />
            {mounted ? t('buttons.format') : 'Format JSON'}
          </button>
          
          <button onClick={onCompact} className="btn btn-purple text-xs sm:text-sm flex-1 sm:flex-initial">
            <Minimize2 className="w-3 h-3 sm:w-4 sm:h-4" />
            {mounted ? t('buttons.compact') : 'Compact JSON'}
          </button>
        </div>
        
        <div className="flex gap-1 sm:gap-1.5 items-center">
          <button onClick={onCopy} className="btn btn-secondary text-xs sm:text-sm flex-1 sm:flex-initial">
            <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
            {mounted ? t('buttons.copy') : 'Copy'}
          </button>
          
          <button onClick={onPaste} className="btn btn-secondary text-xs sm:text-sm flex-1 sm:flex-initial">
            <Clipboard className="w-3 h-3 sm:w-4 sm:h-4" />
            {mounted ? t('buttons.paste') : 'Paste'}
          </button>
          
          <button onClick={onClear} className="btn btn-secondary text-xs sm:text-sm flex-1 sm:flex-initial">
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
            {mounted ? t('buttons.clear') : 'Clear'}
          </button>
        </div>
      </div>
      
      <div className="flex gap-2 items-center">
        {/* Language Selector - Desktop only with label */}
        <div className="hidden md:block">
          {mounted && <LanguageSelector showLabel={true} />}
        </div>
        
        <button
          onClick={onExampleClick}
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs sm:text-sm font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
        >
          <FileJson className="w-3 h-3 sm:w-4 sm:h-4" />
          {mounted ? t('buttons.example') : 'Try an example JSON'}
        </button>
        
        <button
          onClick={onThemeToggle}
          className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover)] transition-all duration-300"
          aria-label={mounted ? t('buttons.toggleTheme') : 'Toggle theme'}
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ControlButtons;