'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '@/hooks/useTheme';
import { useNotification } from '@/hooks/useNotification';
import { JSONFixer } from '@/utils/jsonFixer';
import ControlButtons from '@/components/ControlButtons';
import TabsContainer from '@/components/TabsContainer';
import EditorView from '@/components/EditorView';
import TreeView from '@/components/TreeView';
import EditorErrorBoundary from '@/components/EditorErrorBoundary';
import ErrorBoundary from '@/components/ErrorBoundary';
import Navbar from '@/components/Navbar';

// Lazy load heavy components
const GraphView = dynamic(() => import('@/components/GraphView'), {
  loading: () => <div className="flex items-center justify-center h-full">Loading Graph View...</div>,
  ssr: false,
});

const DiffView = dynamic(() => import('@/components/DiffView'), {
  loading: () => <div className="flex items-center justify-center h-full">Loading Diff View...</div>,
  ssr: false,
});

const StatsView = dynamic(() => import('@/components/StatsView'), {
  loading: () => <div className="flex items-center justify-center h-full">Loading Stats View...</div>,
  ssr: false,
});

const MapView = dynamic(() => import('@/components/MapView'), {
  loading: () => <div className="flex items-center justify-center h-full">Loading Map View...</div>,
  ssr: false,
});

const ChartView = dynamic(() => import('@/components/ChartView'), {
  loading: () => <div className="flex items-center justify-center h-full">Loading Chart View...</div>,
  ssr: false,
});

const SearchView = dynamic(() => import('@/components/SearchView'), {
  loading: () => <div className="flex items-center justify-center h-full">Loading Search View...</div>,
  ssr: false,
});

export default function ToolPageClient() {
  const [editorContent, setEditorContent] = useState('');
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('formatted');
  const [isUpdatingFromTree, setIsUpdatingFromTree] = useState(false);
  const [skipValidation, setSkipValidation] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { showSuccess, showError, showWarning } = useNotification();

  useEffect(() => {
    if (!isUpdatingFromTree && !skipValidation && editorContent) {
      const result = JSONFixer.parseWithFixInfo(editorContent);
      if (result.error) {
        setParsedJson(null);
      } else {
        setParsedJson(result.data);
      }
    } else if (!editorContent) {
      setParsedJson(null);
    }

    if (skipValidation) {
      setSkipValidation(false);
    }
  }, [editorContent, isUpdatingFromTree, skipValidation]);

  const handleFormat = () => {
    if (!editorContent || editorContent.trim() === '') {
      showError('Please enter some JSON to format');
      return;
    }

    const result = JSONFixer.parseWithFixInfo(editorContent);

    if (result.data) {
      const formatted = JSON.stringify(result.data, null, 2);
      setSkipValidation(true);
      setEditorContent(formatted);
      setParsedJson(result.data);

      if (result.wasFixed && result.fixes && result.fixes.length > 0) {
        setTimeout(() => {
          showWarning(`JSON was automatically fixed: ${result.fixes!.join(', ')}`);
        }, 100);
      }
    } else {
      showError(result.error || 'Invalid JSON format');
    }
  };

  const handleCompact = () => {
    if (!editorContent || editorContent.trim() === '') {
      showError('Please enter some JSON to compact');
      return;
    }

    const result = JSONFixer.parseWithFixInfo(editorContent);

    if (result.data) {
      const compacted = JSON.stringify(result.data);
      setSkipValidation(true);
      setEditorContent(compacted);
      setParsedJson(result.data);

      if (result.wasFixed && result.fixes && result.fixes.length > 0) {
        setTimeout(() => {
          showWarning(`JSON was automatically fixed: ${result.fixes!.join(', ')}`);
        }, 100);
      }
    } else {
      showError(result.error || 'Invalid JSON format');
    }
  };

  const handleClear = () => {
    setEditorContent('');
    setParsedJson(null);
  };

  const handleCopy = async () => {
    if (!editorContent || editorContent.trim() === '') {
      showError('Nothing to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(editorContent);
      showSuccess('Copied to clipboard');
    } catch (error) {
      showError('Failed to copy to clipboard');
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || text.trim() === '') {
        showError('Clipboard is empty');
        return;
      }

      const result = JSONFixer.parseWithFixInfo(text);

      if (result.data) {
        const formatted = JSON.stringify(result.data, null, 2);
        setSkipValidation(true);
        setEditorContent(formatted);
        setParsedJson(result.data);
        setActiveTab('formatted');

        if (result.wasFixed && result.fixes && result.fixes.length > 0) {
          setTimeout(() => {
            showWarning(`JSON was automatically fixed: ${result.fixes!.join(', ')}`);
          }, 100);
        }
      } else {
        setEditorContent(text);
        setActiveTab('formatted');
        showError(result.error || 'Invalid JSON format');
      }
    } catch (error) {
      showError('Failed to paste from clipboard');
    }
  };

  const handleTreeUpdate = (newContent: string) => {
    setIsUpdatingFromTree(true);
    setEditorContent(newContent);
    setTimeout(() => setIsUpdatingFromTree(false), 100);
  };

  return (
    <>
      <Navbar theme={theme} onThemeToggle={toggleTheme} />
      <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-4 shadow-lg">
        <div className="mb-3">
          <ControlButtons
            onFormat={handleFormat}
            onCompact={handleCompact}
            onClear={handleClear}
            onCopy={handleCopy}
            onPaste={handlePaste}
            onExampleClick={() => {}}
            theme={theme}
            onThemeToggle={toggleTheme}
          />
        </div>

        <TabsContainer activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="h-[500px] overflow-hidden">
          {activeTab === 'formatted' && (
            <EditorErrorBoundary>
              <EditorView
                content={editorContent}
                onChange={setEditorContent}
                theme={theme}
              />
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
              <DiffView json={parsedJson} />
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
          {activeTab === 'chart' && (
            <ErrorBoundary>
              <ChartView json={parsedJson} />
            </ErrorBoundary>
          )}
          {activeTab === 'search' && (
            <ErrorBoundary>
              <SearchView json={parsedJson} />
            </ErrorBoundary>
          )}
        </div>
      </div>
    </>
  );
}
