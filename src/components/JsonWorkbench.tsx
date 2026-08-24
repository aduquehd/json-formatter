'use client';

import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import type React from 'react';
import { startTransition, useEffect, useOptimistic, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ControlButtons from '@/components/ControlButtons';
import EditorErrorBoundary from '@/components/EditorErrorBoundary';
import EditorWorkspace from '@/components/EditorWorkspace';
import ErrorBoundary from '@/components/ErrorBoundary';
import JsonExampleModal from '@/components/JsonExampleModal';
import StatusBar from '@/components/StatusBar';
import TabsContainer from '@/components/TabsContainer';
import TreeView from '@/components/TreeView';
import { useNotification } from '@/hooks/useNotification';
import { useTheme } from '@/hooks/useTheme';
import * as gtag from '@/lib/gtag';
import { pathToView, type ToolView, viewToPath } from '@/lib/tools';
import {
  isParseSuccess,
  MAX_DOCUMENT_CHARS,
  parseJsonStrict,
  sortObjectKeysDeep,
} from '@/utils/jsonDocument';
import { JSONFixer } from '@/utils/jsonFixer';
import { describeLossyScan, scanLossyRewrites } from '@/utils/jsonLossy';
import { formatJSON } from '@/utils/jsonUtils';
import { runDepthGuarded } from '@/utils/jsonWalk';

// Lazy load heavy components for better performance. Only the active view's
// chunk loads, so each route pulls in just the view it opens (e.g. /graph loads
// GraphView, not Stats/Map). Diff lives inside the editor now and is lazy-loaded
// from within EditorWorkspace.
const GraphView = dynamic(() => import('@/components/GraphView'), {
  loading: () => (
    <div className="flex items-center justify-center h-full">Loading Graph View...</div>
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

/**
 * The parsed document. `isValid` is carried explicitly instead of being inferred
 * from `data`, because `null` is both "nothing parsed" and a perfectly valid
 * JSON document — as are `0`, `false` and `""`.
 */
interface DocumentState {
  isValid: boolean;
  data: any;
}

const EMPTY_DOCUMENT: DocumentState = { isValid: false, data: null };

const SORT_DEPTH_FALLBACK =
  'This document is nested too deeply to sort its keys (limit: {{limit}} levels).';

const LOSSY_WARNING_FALLBACK = 'Your JSON was rewritten and some values changed: {{details}}.';

/**
 * The JSON workbench. It lives in the persistent `(app)` layout, so its state
 * (editor content, options) survives navigation between view routes. The active
 * view is derived from the URL — clicking a tab navigates to that view's clean
 * path (`/`, `/tree`, `/diff`, …) rather than flipping local state.
 */
export default function JsonWorkbench() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const routeView: ToolView = pathToView[pathname] ?? 'formatted';
  // Optimistic view: the panel swaps the moment a tab is clicked, while the URL
  // (and the SEO content below the workbench) catches up when the navigation
  // commits. Without this, the switch would wait on the route's RSC fetch.
  const [activeTab, setOptimisticView] = useOptimistic(routeView);
  // The diff experience now lives inside the editor, so both `/` and the legacy
  // `/diff` URL render the editor view; `/diff` just opens compare on arrival.
  const isEditorView = activeTab === 'formatted' || activeTab === 'diff';
  const panelView: ToolView = isEditorView ? 'formatted' : activeTab;

  // Warm every view route so the URL swap on tab clicks doesn't wait on the
  // network (no-op in dev, where routes still compile on first visit).
  useEffect(() => {
    for (const path of Object.keys(pathToView)) router.prefetch(path);
  }, [router]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [editorContent, setEditorContent] = useState('');
  // Compare mode (second editor + diff panel) and the document it diffs against.
  // Held here, in the persistent layout, so they survive switching between views.
  const [compareMode, setCompareMode] = useState(false);
  const [compareContent, setCompareContent] = useState('');
  const [parsed, setParsed] = useState<DocumentState>(EMPTY_DOCUMENT);
  const parsedJson = parsed.data;
  const [showExampleModal, setShowExampleModal] = useState(false);
  const [isUpdatingFromTree, setIsUpdatingFromTree] = useState(false);
  const [skipValidation, setSkipValidation] = useState(false);
  const [copied, setCopied] = useState(false);
  const [indent, setIndent] = useState('2');
  const [sortKeys, setSortKeys] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();
  const { showError, showWarning } = useNotification();

  // Landing on the legacy /diff URL opens compare automatically. Only fires on
  // arrival, so the user can still close compare while staying on /diff.
  useEffect(() => {
    if (activeTab === 'diff') setCompareMode(true);
  }, [activeTab]);

  // Toggle compare mode; closing it while on /diff returns to the editor URL so
  // the address bar never claims "diff" while a single editor is showing.
  const handleCompareModeChange = (on: boolean) => {
    setCompareMode(on);
    if (!on && activeTab === 'diff') router.push(viewToPath('formatted'), { scroll: false });
  };

  // Navigate to a view's clean URL. The layout persists, so the editor content
  // is preserved across the navigation.
  const goToView = (view: ToolView) => {
    gtag.trackTabSwitch(view);
    startTransition(() => {
      setOptimisticView(view);
      router.push(viewToPath(view), { scroll: false });
    });
  };

  // Indentation passed to JSON.stringify: a number of spaces, or a literal tab.
  const indentValue: string | number = indent === 'tab' ? '\t' : parseInt(indent, 10);

  // Recursively sort object keys A→Z (arrays keep their order). Lives in
  // src/utils/jsonDocument.ts so it can be unit-tested — the inline version it
  // replaces silently dropped a member literally named `__proto__`.
  //
  // The sort recurses, so a document nested past the display limit cannot be
  // sorted. It is still perfectly formattable, so the toast explains what was
  // skipped and the unsorted document goes through rather than the click
  // throwing out of its handler, where no error boundary is watching.
  const sortDocument = (data: any) => {
    const sorted = runDepthGuarded(() => sortObjectKeysDeep(data));
    if (sorted.ok) return sorted.value;
    showError(
      mounted
        ? t('depth.sortFailed', { defaultValue: SORT_DEPTH_FALLBACK, limit: sorted.limit })
        : SORT_DEPTH_FALLBACK.replace('{{limit}}', String(sorted.limit))
    );
    return data;
  };

  const applyOptions = (data: any) => (sortKeys ? sortDocument(data) : data);

  // What Format / Compact are about to change about the document — or null when
  // the round trip is faithful. Read from the text still in the editor, before
  // anything overwrites it.
  const describeLossyRewrite = (source: string): string | null =>
    describeLossyScan(scanLossyRewrites(source), (key, fallback) =>
      mounted ? t(key, { defaultValue: fallback }) : fallback
    );

  // Format and Compact are `JSON.parse` followed by `JSON.stringify`, and that
  // round trip silently rewrites integers past `Number.MAX_SAFE_INTEGER`, numbers
  // too large to represent, minus zero, and duplicate keys — all reported to the
  // user today as a successful format. A genuinely lossless formatter needs its
  // own number type and serialiser; saying what changed costs one scan, and is
  // the difference between a surprise and a decision.
  const warnAboutLossyRewrite = (details: string | null) => {
    if (details === null) return;
    setTimeout(() => {
      showWarning(
        mounted
          ? t('format.lossy.warning', { defaultValue: LOSSY_WARNING_FALLBACK, details })
          : LOSSY_WARNING_FALLBACK.replace('{{details}}', details)
      );
    }, 100);
  };

  // Re-format the current document immediately when indentation or key-sort
  // options change, so toggling 2 / 4 / Tab (or Sort keys) reflows the JSON
  // without needing a manual Format click. No-op on empty or invalid input.
  const reformatWith = (indentSel: string, sort: boolean) => {
    if (!editorContent || editorContent.trim() === '') return;
    const result = JSONFixer.parseWithFixInfo(editorContent);
    if (!isParseSuccess(result)) return;
    const iv: string | number = indentSel === 'tab' ? '\t' : parseInt(indentSel, 10);
    // Same destructive round trip as Format, reached from a control the user
    // does not think of as rewriting anything. Warning here does not become
    // noise: `JSON.stringify` output always scans clean, so a document that has
    // already been through this fires nothing on the next toggle.
    const lossy = describeLossyRewrite(editorContent);
    const data = sort ? sortDocument(result.data) : result.data;
    setSkipValidation(true);
    setEditorContent(JSON.stringify(data, null, iv));
    setParsed({ isValid: true, data });
    warnAboutLossyRewrite(lossy);
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
    // Format/compact/paste/open set `parsed` directly, so skip re-parsing once.
    // Note this defers rather than cancels: clearing the flag re-runs the effect
    // and the debounced parse still lands. That is safe only because every path
    // that sets `parsed` from repaired data also writes `JSON.stringify` of that
    // same data back into the editor, so the strict re-parse converges on the
    // identical value. Do not add a path that sets `parsed` without doing so.
    if (skipValidation) {
      setSkipValidation(false);
      return;
    }
    if (isUpdatingFromTree) return;
    if (!editorContent) {
      setParsed(EMPTY_DOCUMENT);
      return;
    }
    // Debounce parsing so large documents don't re-parse on every keystroke.
    // This is a plain JSON.parse, never the repair pipeline: repair is
    // super-linear on large invalid input (380KB → ~800ms) and a document is
    // invalid for exactly as long as the user is still typing it. Whether the
    // document is *fixable* is decided only on an explicit action below.
    const timeoutId = setTimeout(() => {
      const result = parseJsonStrict(editorContent);
      setParsed({ isValid: result.isValid, data: result.data });
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [editorContent, isUpdatingFromTree, skipValidation]);

  const handleFormat = () => {
    if (!editorContent || editorContent.trim() === '') {
      showError(mounted ? t('messages.errorEmpty') : 'Please enter some JSON to format');
      return;
    }

    // Track format action
    gtag.trackJsonFormat();

    // Format is the explicit action, so this is where the repair pipeline runs.
    const result = JSONFixer.parseWithFixInfo(editorContent);

    if (isParseSuccess(result)) {
      const lossy = describeLossyRewrite(editorContent);
      const data = applyOptions(result.data);
      const formatted = JSON.stringify(data, null, indentValue);

      // Set skip validation flag to prevent useEffect from running
      setSkipValidation(true);
      setEditorContent(formatted);
      setParsed({ isValid: true, data });

      warnAboutLossyRewrite(lossy);

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

    // Compact rewrites the document, so the repair pipeline runs here too.
    const result = JSONFixer.parseWithFixInfo(editorContent);

    if (isParseSuccess(result)) {
      const lossy = describeLossyRewrite(editorContent);
      const data = applyOptions(result.data);
      const compacted = JSON.stringify(data);

      // Set skip validation flag to prevent useEffect from running
      setSkipValidation(true);
      setEditorContent(compacted);
      setParsed({ isValid: true, data });

      warnAboutLossyRewrite(lossy);

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
    setParsed(EMPTY_DOCUMENT);
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

      // Enforce the size cap at the boundary, refusing the paste rather than
      // accepting it and then destroying the editor's contents.
      if (text.length > MAX_DOCUMENT_CHARS) {
        showError(
          `Clipboard content is too large (${(text.length / 1024 / 1024).toFixed(2)}MB). Maximum allowed is 10MB.`
        );
        return;
      }

      // Paste is an explicit action, so the repair pipeline runs here.
      const result = JSONFixer.parseWithFixInfo(text);

      if (isParseSuccess(result)) {
        // Same round trip as Format, on text the user never had a chance to
        // read, so the same warning applies.
        const lossy = describeLossyRewrite(text);
        // JSON was successfully parsed (possibly after fixing)
        const formatted = JSON.stringify(result.data, null, 2);

        // Set skip validation flag to prevent useEffect from running
        setSkipValidation(true);

        // Update editor content with fixed JSON
        setEditorContent(formatted);

        // Update parsed JSON directly
        setParsed({ isValid: true, data: result.data });

        // Show the editor so the pasted content is visible.
        router.push('/', { scroll: false });

        warnAboutLossyRewrite(lossy);

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
        router.push('/', { scroll: false });
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
    router.push('/', { scroll: false });
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
    if (text.length > MAX_DOCUMENT_CHARS) {
      showError('File too large. Maximum allowed is 10MB.');
      return;
    }
    const result = JSONFixer.parseWithFixInfo(text);
    if (isParseSuccess(result)) {
      const lossy = describeLossyRewrite(text);
      const data = applyOptions(result.data);
      setSkipValidation(true);
      setEditorContent(JSON.stringify(data, null, indentValue));
      setParsed({ isValid: true, data });
      warnAboutLossyRewrite(lossy);
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
    router.push('/', { scroll: false });
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
    <div className="container mx-auto px-3 sm:px-4 md:px-5 pt-24 sm:pt-20 md:pt-20 pb-3 sm:pb-4 md:pb-5">
      <main
        id="main-content"
        className={`bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-lg h-[calc(100dvh-108px)] sm:h-[calc(100vh-104px)] md:h-[calc(100vh-100px)] flex flex-col backdrop-blur-xl${
          compareMode && isEditorView ? ' compare-active' : ''
        }`}
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

        <TabsContainer activeTab={panelView} onTabChange={goToView} />

        <div
          className={`flex-1 overflow-hidden editor-dropzone relative ${isDragOver ? 'drag-over' : ''}`}
        >
          {/* The editor stays mounted across view switches (hidden, not
              unmounted), so CodeMirror keeps its instance, scroll position and
              cursor — switching back to the Editor tab is instant. */}
          <div
            className="h-full"
            role="tabpanel"
            id="formatted-tab"
            aria-labelledby="formatted-tabbtn"
            hidden={!isEditorView}
          >
            <EditorErrorBoundary>
              <EditorWorkspace
                content={editorContent}
                onChange={setEditorContent}
                theme={theme}
                compareMode={compareMode}
                onCompareModeChange={handleCompareModeChange}
                compareContent={compareContent}
                onCompareContentChange={setCompareContent}
              />
            </EditorErrorBoundary>
          </div>
          {!isEditorView && (
            <div
              className="h-full"
              role="tabpanel"
              id={`${panelView}-tab`}
              aria-labelledby={`${panelView}-tabbtn`}
            >
              {activeTab === 'tree' && (
                <ErrorBoundary>
                  <TreeView
                    json={parsedJson}
                    isValid={parsed.isValid}
                    onUpdate={handleTreeUpdate}
                  />
                </ErrorBoundary>
              )}
              {activeTab === 'graph' && (
                <ErrorBoundary>
                  <GraphView json={parsedJson} isValid={parsed.isValid} />
                </ErrorBoundary>
              )}
              {activeTab === 'stats' && (
                <ErrorBoundary>
                  <StatsView json={parsedJson} isValid={parsed.isValid} />
                </ErrorBoundary>
              )}
              {activeTab === 'map' && (
                <ErrorBoundary>
                  <MapView json={parsedJson} isValid={parsed.isValid} />
                </ErrorBoundary>
              )}
              {activeTab === 'search' && (
                <ErrorBoundary>
                  <SearchView json={parsedJson} isValid={parsed.isValid} />
                </ErrorBoundary>
              )}
            </div>
          )}
        </div>

        {/* The status bar is the one piece of the workbench that renders
            outside a view boundary, so a throw here used to unmount the whole
            app and take the user's editor content with it. The fallback is an
            empty strip rather than the boundary's default full-screen panel:
            losing the byte count is a footnote, losing the editor is the bug. */}
        <ErrorBoundary fallback={<div className="status-bar" />}>
          <StatusBar content={editorContent} json={parsedJson} isValid={parsed.isValid} />
        </ErrorBoundary>
      </main>

      {showExampleModal && (
        <JsonExampleModal
          onSelect={handleExampleSelect}
          onClose={() => setShowExampleModal(false)}
        />
      )}
    </div>
  );
}
