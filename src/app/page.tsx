'use client';

import dynamic from 'next/dynamic';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ControlButtons from '@/components/ControlButtons';
import EditorErrorBoundary from '@/components/EditorErrorBoundary';
import EditorView from '@/components/EditorView';
import ErrorBoundary from '@/components/ErrorBoundary';
import JsonExampleModal from '@/components/JsonExampleModal';
import Navbar from '@/components/Navbar';
import StatusBar from '@/components/StatusBar';
import TabsContainer from '@/components/TabsContainer';
import TreeView from '@/components/TreeView';
import { useNotification } from '@/hooks/useNotification';
import { useTheme } from '@/hooks/useTheme';
import * as gtag from '@/lib/gtag';
import { JSONFixer } from '@/utils/jsonFixer';
import { compactJSON, formatJSON } from '@/utils/jsonUtils';

// Lazy load heavy components for better performance
const GraphView = dynamic(() => import('@/components/GraphView'), {
  loading: () => (
    <div className="flex items-center justify-center h-full">Loading Graph View...</div>
  ),
  ssr: false,
});

const DiffView = dynamic(() => import('@/components/DiffView'), {
  loading: () => (
    <div className="flex items-center justify-center h-full">Loading Diff View...</div>
  ),
  ssr: false,
});

const StatsView = dynamic(() => import('@/components/StatsView'), {
  loading: () => (
    <div className="flex items-center justify-center h-full">Loading Stats View...</div>
  ),
  ssr: false,
});

const MapView = dynamic(() => import('@/components/MapView'), {
  loading: () => <div className="flex items-center justify-center h-full">Loading Map View...</div>,
  ssr: false,
});

const SearchView = dynamic(() => import('@/components/SearchView'), {
  loading: () => (
    <div className="flex items-center justify-center h-full">Loading Search View...</div>
  ),
  ssr: false,
});

export default function Home() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [editorContent, setEditorContent] = useState('');
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('formatted');
  const [showExampleModal, setShowExampleModal] = useState(false);
  const [isUpdatingFromTree, setIsUpdatingFromTree] = useState(false);
  const [skipValidation, setSkipValidation] = useState(false);
  const [copied, setCopied] = useState(false);
  const [indent, setIndent] = useState('2');
  const [sortKeys, setSortKeys] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();
  const { showSuccess, showError, showWarning } = useNotification();

  // Indentation passed to JSON.stringify: a number of spaces, or a literal tab.
  const indentValue: string | number = indent === 'tab' ? '\t' : parseInt(indent, 10);

  // Recursively sort object keys A→Z (arrays keep their order).
  const sortObjectKeys = (value: any): any => {
    if (Array.isArray(value)) return value.map(sortObjectKeys);
    if (value && typeof value === 'object') {
      return Object.keys(value)
        .sort()
        .reduce((acc: Record<string, any>, key) => {
          acc[key] = sortObjectKeys(value[key]);
          return acc;
        }, {});
    }
    return value;
  };

  const applyOptions = (data: any) => (sortKeys ? sortObjectKeys(data) : data);

  // Re-format the current document immediately when indentation or key-sort
  // options change, so toggling 2 / 4 / Tab (or Sort keys) reflows the JSON
  // without needing a manual Format click. No-op on empty or invalid input.
  const reformatWith = (indentSel: string, sort: boolean) => {
    if (!editorContent || editorContent.trim() === '') return;
    const result = JSONFixer.parseWithFixInfo(editorContent);
    if (!result.data) return;
    const iv: string | number = indentSel === 'tab' ? '\t' : parseInt(indentSel, 10);
    const data = sort ? sortObjectKeys(result.data) : result.data;
    setSkipValidation(true);
    setEditorContent(JSON.stringify(data, null, iv));
    setParsedJson(result.data);
  };

  const handleIndentChange = (value: string) => {
    setIndent(value);
    reformatWith(value, sortKeys);
  };

  const handleSortKeysToggle = () => {
    const next = !sortKeys;
    setSortKeys(next);
    reformatWith(indent, next);
  };

  useEffect(() => {
    // Format/compact/paste set parsedJson directly, so skip re-parsing once.
    if (skipValidation) {
      setSkipValidation(false);
      return;
    }
    if (isUpdatingFromTree) return;
    if (!editorContent) {
      setParsedJson(null);
      return;
    }
    // Debounce parsing so large documents don't re-parse on every keystroke.
    const timeoutId = setTimeout(() => {
      const result = JSONFixer.parseWithFixInfo(editorContent);
      setParsedJson(result.error ? null : result.data);
    }, 250);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorContent, isUpdatingFromTree, skipValidation]);

  const handleFormat = () => {
    if (!editorContent || editorContent.trim() === '') {
      showError(mounted ? t('messages.errorEmpty') : 'Please enter some JSON to format');
      return;
    }

    // Track format action
    gtag.trackJsonFormat();

    // Try to parse and potentially fix the JSON
    const result = JSONFixer.parseWithFixInfo(editorContent);

    if (result.data) {
      const formatted = JSON.stringify(applyOptions(result.data), null, indentValue);

      // Set skip validation flag to prevent useEffect from running
      setSkipValidation(true);
      setEditorContent(formatted);
      setParsedJson(result.data);

      if (result.wasFixed && result.fixes && result.fixes.length > 0) {
        setTimeout(() => {
          showWarning(`JSON was automatically fixed: ${result.fixes!.join(', ')}`);
        }, 100);
      }
    } else {
      showError(result.error || (mounted ? t('messages.errorInvalid') : 'Invalid JSON format'));
    }
  };

  const handleCompact = () => {
    if (!editorContent || editorContent.trim() === '') {
      showError(mounted ? t('messages.errorEmpty') : 'Please enter some JSON to format');
      return;
    }

    // Track compact action
    gtag.trackJsonCompact();

    // Try to parse and potentially fix the JSON
    const result = JSONFixer.parseWithFixInfo(editorContent);

    if (result.data) {
      const compacted = JSON.stringify(applyOptions(result.data));

      // Set skip validation flag to prevent useEffect from running
      setSkipValidation(true);
      setEditorContent(compacted);
      setParsedJson(result.data);

      if (result.wasFixed && result.fixes && result.fixes.length > 0) {
        setTimeout(() => {
          showWarning(`JSON was automatically fixed: ${result.fixes!.join(', ')}`);
        }, 100);
      }
    } else {
      showError(result.error || (mounted ? t('messages.errorInvalid') : 'Invalid JSON format'));
    }
  };

  const handleClear = () => {
    gtag.trackJsonClear();
    setEditorContent('');
    setParsedJson(null);
  };

  const handleCopy = async () => {
    if (!editorContent || editorContent.trim() === '') {
      showError(mounted ? t('messages.errorEmpty') : 'Please enter some JSON to format');
      return;
    }

    gtag.trackJsonCopy();

    try {
      await navigator.clipboard.writeText(editorContent);

      // Show inline "Copied ✓" feedback on the button.
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);

      // Check if the content is valid JSON
      try {
        JSON.parse(editorContent);
        // Success - inline feedback above is enough
      } catch {
        showWarning(
          (mounted ? t('messages.copySuccess') : 'Copied to clipboard') + ' (Note: Invalid JSON)'
        );
      }
    } catch (error) {
      showError(mounted ? t('messages.errorCopy') : 'Failed to copy to clipboard');
    }
  };

  const handlePaste = async () => {
    gtag.trackJsonPaste();

    try {
      const text = await navigator.clipboard.readText();
      if (!text || text.trim() === '') {
        showError(mounted ? t('messages.errorEmpty') : 'Please enter some JSON to format');
        return;
      }

      // Try to parse and potentially fix the JSON
      const result = JSONFixer.parseWithFixInfo(text);

      if (result.data) {
        // JSON was successfully parsed (possibly after fixing)
        const formatted = JSON.stringify(result.data, null, 2);

        // Set skip validation flag to prevent useEffect from running
        setSkipValidation(true);

        // Update editor content with fixed JSON
        setEditorContent(formatted);

        // Update parsed JSON directly
        setParsedJson(result.data);

        setActiveTab('formatted');

        if (result.wasFixed && result.fixes && result.fixes.length > 0) {
          // JSON was fixed - show warning after a brief delay to ensure UI updates
          setTimeout(() => {
            showWarning(
              mounted
                ? t('messages.warningFixed')
                : `JSON was automatically fixed: ${result.fixes!.join(', ')}`
            );
          }, 100);
        } else {
          // JSON was valid - no notification needed
        }
      } else {
        // Could not parse or fix the JSON
        setEditorContent(text);
        setActiveTab('formatted');
        showError(result.error || (mounted ? t('messages.errorInvalid') : 'Invalid JSON format'));
      }
    } catch (error) {
      showError(mounted ? t('messages.errorPaste') : 'Failed to paste from clipboard');
    }
  };

  const handleExampleSelect = (exampleContent: string) => {
    // Track example usage
    const exampleName = exampleContent.includes('products')
      ? 'ecommerce'
      : exampleContent.includes('sales')
        ? 'financial'
        : exampleContent.includes('database')
          ? 'configuration'
          : exampleContent.includes('coordinates')
            ? 'geographic'
            : 'unknown';
    gtag.trackExampleUsed(exampleName);

    try {
      // Format the example content immediately
      const formatted = formatJSON(exampleContent);
      setEditorContent(formatted);
    } catch {
      // If formatting fails, just use the original content
      setEditorContent(exampleContent);
    }
    setShowExampleModal(false);
    setActiveTab('formatted');
  };

  const handleTreeUpdate = (newContent: string) => {
    setIsUpdatingFromTree(true);
    setEditorContent(newContent);
    setTimeout(() => setIsUpdatingFromTree(false), 100);
  };

  const handleDownload = () => {
    if (!editorContent || editorContent.trim() === '') {
      showError(mounted ? t('messages.errorEmpty') : 'Please enter some JSON to format');
      return;
    }
    const blob = new Blob([editorContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Shared loader for both the file picker and drag-and-drop.
  const loadFromText = (text: string) => {
    if (text.length > 10 * 1024 * 1024) {
      showError('File too large. Maximum allowed is 10MB.');
      return;
    }
    const result = JSONFixer.parseWithFixInfo(text);
    if (result.data) {
      setSkipValidation(true);
      setEditorContent(JSON.stringify(applyOptions(result.data), null, indentValue));
      setParsedJson(result.data);
      if (result.wasFixed && result.fixes && result.fixes.length > 0) {
        setTimeout(
          () => showWarning(`JSON was automatically fixed: ${result.fixes!.join(', ')}`),
          100
        );
      }
    } else {
      setEditorContent(text);
      showError(result.error || (mounted ? t('messages.errorInvalid') : 'Invalid JSON format'));
    }
    setActiveTab('formatted');
  };

  const handleOpenFile = () => fileInputRef.current?.click();

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadFromText(await file.text());
    }
    e.target.value = ''; // allow re-selecting the same file later
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (Array.from(e.dataTransfer.types).includes('Files')) {
      e.preventDefault();
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target) setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      loadFromText(await file.text());
    }
  };

  // Keyboard shortcuts: ⌘/Ctrl+Enter = Format.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        handleFormat();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorContent, indent, sortKeys]);

  return (
    <>
      <Navbar theme={theme} onThemeToggle={toggleTheme} />

      {/* Main Tool Section */}
      <div className="container mx-auto px-3 sm:px-4 md:px-5 pt-24 sm:pt-20 md:pt-20 pb-3 sm:pb-4 md:pb-5">
        <main
          id="main-content"
          className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-lg h-[calc(100dvh-108px)] sm:h-[calc(100vh-104px)] md:h-[calc(100vh-100px)] flex flex-col backdrop-blur-xl"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json,text/plain"
            onChange={handleFileInputChange}
            className="hidden"
            aria-hidden="true"
          />
          <div className="mb-2 sm:mb-3">
            <ControlButtons
              onFormat={handleFormat}
              onCompact={handleCompact}
              onClear={handleClear}
              onCopy={handleCopy}
              onPaste={handlePaste}
              onExampleClick={() => setShowExampleModal(true)}
              onOpenFile={handleOpenFile}
              onDownload={handleDownload}
              copied={copied}
              indent={indent}
              onIndentChange={handleIndentChange}
              sortKeys={sortKeys}
              onSortKeysToggle={handleSortKeysToggle}
              theme={theme}
              onThemeToggle={toggleTheme}
            />
          </div>

          <TabsContainer
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              gtag.trackTabSwitch(tab);
            }}
          />

          <div
            className={`flex-1 overflow-hidden editor-dropzone relative ${isDragOver ? 'drag-over' : ''}`}
            role="tabpanel"
            id={`${activeTab}-tab`}
            aria-labelledby={`${activeTab}-tabbtn`}
          >
            {activeTab === 'formatted' && (
              <EditorErrorBoundary>
                <EditorView content={editorContent} onChange={setEditorContent} theme={theme} />
              </EditorErrorBoundary>
            )}
            {activeTab === 'tree' && (
              <ErrorBoundary>
                <TreeView json={parsedJson} onUpdate={handleTreeUpdate} />
              </ErrorBoundary>
            )}
            {activeTab === 'graph' && (
              <ErrorBoundary>
                <GraphView json={parsedJson} />
              </ErrorBoundary>
            )}
            {activeTab === 'diff' && (
              <ErrorBoundary>
                <DiffView json={parsedJson} theme={theme} />
              </ErrorBoundary>
            )}
            {activeTab === 'stats' && (
              <ErrorBoundary>
                <StatsView json={parsedJson} />
              </ErrorBoundary>
            )}
            {activeTab === 'map' && (
              <ErrorBoundary>
                <MapView json={parsedJson} />
              </ErrorBoundary>
            )}
            {activeTab === 'search' && (
              <ErrorBoundary>
                <SearchView json={parsedJson} />
              </ErrorBoundary>
            )}
          </div>

          <StatusBar content={editorContent} json={parsedJson} />
        </main>
      </div>

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

      {showExampleModal && (
        <JsonExampleModal
          onSelect={handleExampleSelect}
          onClose={() => setShowExampleModal(false)}
        />
      )}
    </>
  );
}
