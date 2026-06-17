'use client';

import React from 'react';
import {
  Code2,
  Minimize2,
  Copy,
  Check,
  Clipboard,
  Trash2,
  FileJson,
  FolderOpen,
  Download,
  ArrowDownAZ,
  Moon,
  Sun,
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
  onOpenFile: () => void;
  onDownload: () => void;
  copied: boolean;
  indent: string;
  onIndentChange: (value: string) => void;
  sortKeys: boolean;
  onSortKeysToggle: () => void;
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
  onOpenFile,
  onDownload,
  copied,
  indent,
  onIndentChange,
  sortKeys,
  onSortKeysToggle,
  theme,
  onThemeToggle,
}) => {
  const { t } = useTranslation();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const btn = 'btn text-xs sm:text-sm flex-1 sm:flex-initial';
  const iconCls = 'w-3 h-3 sm:w-4 sm:h-4';

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-2 sm:gap-3">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-1.5 items-stretch sm:items-center flex-1 w-full sm:w-auto">
        {/* Primary action + transform */}
        <div className="flex gap-1 sm:gap-1.5 items-center">
          <button onClick={onFormat} className={`${btn} btn-primary`} title="Format JSON (⌘/Ctrl + ↵)">
            <Code2 className={iconCls} />
            {mounted ? t('buttons.format') : 'Format JSON'}
          </button>

          <button onClick={onCompact} className={`${btn} btn-secondary`} title="Minify JSON">
            <Minimize2 className={iconCls} />
            {mounted ? t('buttons.compact') : 'Compact JSON'}
          </button>
        </div>

        {/* Clipboard */}
        <div className="flex gap-1 sm:gap-1.5 items-center">
          <button onClick={onCopy} className={`${btn} btn-secondary`} title="Copy to clipboard">
            {copied ? <Check className={iconCls} /> : <Copy className={iconCls} />}
            {copied
              ? mounted
                ? t('buttons.copied', 'Copied')
                : 'Copied'
              : mounted
                ? t('buttons.copy')
                : 'Copy'}
          </button>

          <button onClick={onPaste} className={`${btn} btn-secondary`} title="Paste from clipboard">
            <Clipboard className={iconCls} />
            {mounted ? t('buttons.paste') : 'Paste'}
          </button>

          <button onClick={onClear} className={`${btn} btn-secondary`} title="Clear editor">
            <Trash2 className={iconCls} />
            {mounted ? t('buttons.clear') : 'Clear'}
          </button>
        </div>

        {/* File actions */}
        <div className="flex gap-1 sm:gap-1.5 items-center">
          <button onClick={onOpenFile} className={`${btn} btn-secondary`} title="Open a .json file">
            <FolderOpen className={iconCls} />
            {mounted ? t('buttons.open', 'Open') : 'Open'}
          </button>

          <button onClick={onDownload} className={`${btn} btn-secondary`} title="Download (⌘/Ctrl + S)">
            <Download className={iconCls} />
            {mounted ? t('buttons.download') : 'Download'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        {/* Format options - desktop only */}
        <div className="hidden lg:flex items-center gap-1.5">
          <select
            value={indent}
            onChange={(e) => onIndentChange(e.target.value)}
            className="toolbar-select"
            aria-label="Indentation"
            title="Indentation used when formatting"
          >
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tab</option>
          </select>

          <button
            onClick={onSortKeysToggle}
            className={`btn btn-secondary text-xs sm:text-sm ${sortKeys ? 'is-active' : ''}`}
            title="Sort object keys A→Z when formatting"
            aria-pressed={sortKeys}
          >
            <ArrowDownAZ className={iconCls} />
            {mounted ? t('buttons.sortKeys', 'Sort keys') : 'Sort keys'}
          </button>
        </div>

        {/* Language Selector - Desktop only with label */}
        <div className="hidden md:block">{mounted && <LanguageSelector showLabel={true} />}</div>

        <button onClick={onExampleClick} className={`${btn} btn-secondary`} title="Load a sample JSON">
          <FileJson className={iconCls} />
          <span className="sm:hidden">{mounted ? t('buttons.exampleShort', 'Example') : 'Example'}</span>
          <span className="hidden sm:inline">{mounted ? t('buttons.example') : 'Try an example JSON'}</span>
        </button>

        <button
          onClick={onThemeToggle}
          className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg bg-[var(--btn-secondary-bg)] border border-[var(--border-color)] hover:bg-[var(--btn-secondary-hover)] transition-colors"
          aria-label={mounted ? t('buttons.toggleTheme') : 'Toggle theme'}
          title="Toggle light / dark theme"
        >
          {theme === 'light' ? <Moon className="w-4 h-4 sm:w-5 sm:h-5" /> : <Sun className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>
      </div>
    </div>
  );
};

export default ControlButtons;
