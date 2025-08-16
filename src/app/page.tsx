'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import ControlButtons from '@/components/ControlButtons';
import TabsContainer from '@/components/TabsContainer';
import EditorView from '@/components/EditorView';
import TreeView from '@/components/TreeView';
import JsonExampleModal from '@/components/JsonExampleModal';
import ErrorBoundary from '@/components/ErrorBoundary';
import EditorErrorBoundary from '@/components/EditorErrorBoundary';
import { useTheme } from '@/hooks/useTheme';
import { useNotification } from '@/hooks/useNotification';
import { JSONFixer } from '@/utils/jsonFixer';
import { formatJSON, compactJSON } from '@/utils/jsonUtils';
import * as gtag from '@/lib/gtag';

// Lazy load heavy components for better performance
const GraphView = dynamic(
  () => import('@/components/GraphView'),
  {
    loading: () => <div className="flex items-center justify-center h-full">Loading Graph View...</div>,
    ssr: false
  }
);

const DiffView = dynamic(
  () => import('@/components/DiffView'),
  {
    loading: () => <div className="flex items-center justify-center h-full">Loading Diff View...</div>,
    ssr: false
  }
);

const StatsView = dynamic(
  () => import('@/components/StatsView'),
  {
    loading: () => <div className="flex items-center justify-center h-full">Loading Stats View...</div>,
    ssr: false
  }
);

const MapView = dynamic(
  () => import('@/components/MapView'),
  {
    loading: () => <div className="flex items-center justify-center h-full">Loading Map View...</div>,
    ssr: false
  }
);

const ChartView = dynamic(
  () => import('@/components/ChartView'),
  {
    loading: () => <div className="flex items-center justify-center h-full">Loading Chart View...</div>,
    ssr: false
  }
);

const SearchView = dynamic(
  () => import('@/components/SearchView'),
  {
    loading: () => <div className="flex items-center justify-center h-full">Loading Search View...</div>,
    ssr: false
  }
);

export default function Home() {
  const [editorContent, setEditorContent] = useState('');
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('formatted');
  const [showExampleModal, setShowExampleModal] = useState(false);
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
    
    // Reset skip validation flag
    if (skipValidation) {
      setSkipValidation(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorContent, isUpdatingFromTree, skipValidation]);

  const handleFormat = () => {
    if (!editorContent || editorContent.trim() === '') {
      showError('Please enter some JSON to format');
      return;
    }
    
    // Track format action
    gtag.trackJsonFormat();
    
    // Try to parse and potentially fix the JSON
    const result = JSONFixer.parseWithFixInfo(editorContent);
    
    if (result.data) {
      const formatted = JSON.stringify(result.data, null, 2);
      
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
      showError(result.error || 'Invalid JSON format');
    }
  };

  const handleCompact = () => {
    if (!editorContent || editorContent.trim() === '') {
      showError('Please enter some JSON to compact');
      return;
    }
    
    // Track compact action
    gtag.trackJsonCompact();
    
    // Try to parse and potentially fix the JSON
    const result = JSONFixer.parseWithFixInfo(editorContent);
    
    if (result.data) {
      const compacted = JSON.stringify(result.data);
      
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
      showError(result.error || 'Invalid JSON format');
    }
  };

  const handleClear = () => {
    gtag.trackJsonClear();
    setEditorContent('');
    setParsedJson(null);
  };

  const handleCopy = async () => {
    if (!editorContent || editorContent.trim() === '') {
      showError('Nothing to copy');
      return;
    }
    
    gtag.trackJsonCopy();
    
    try {
      await navigator.clipboard.writeText(editorContent);
      
      // Check if the content is valid JSON
      try {
        JSON.parse(editorContent);
        // Success - no notification needed
      } catch {
        showWarning('Content copied (Note: Invalid JSON)');
      }
    } catch (error) {
      showError('Failed to copy to clipboard');
    }
  };

  const handlePaste = async () => {
    gtag.trackJsonPaste();
    
    try {
      const text = await navigator.clipboard.readText();
      if (!text || text.trim() === '') {
        showError('Clipboard is empty');
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
            showWarning(`JSON was automatically fixed: ${result.fixes!.join(', ')}`);
          }, 100);
        } else {
          // JSON was valid - no notification needed
        }
      } else {
        // Could not parse or fix the JSON
        setEditorContent(text);
        setActiveTab('formatted');
        showError(result.error || 'Invalid JSON: Please check the syntax and try again');
      }
    } catch (error) {
      showError('Failed to paste - please check clipboard permissions');
    }
  };

  const handleExampleSelect = (exampleContent: string) => {
    // Track example usage
    const exampleName = exampleContent.includes('products') ? 'ecommerce' : 
                       exampleContent.includes('sales') ? 'financial' :
                       exampleContent.includes('database') ? 'configuration' :
                       exampleContent.includes('coordinates') ? 'geographic' : 'unknown';
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

  return (
    <>
      <h1 className="sr-only">JSON Formatter, JSON Viewer, JSON Validator - Free Online JSON Tools for Developers</h1>
      <Navbar theme={theme} onThemeToggle={toggleTheme} />
      <div className="container mx-auto px-3 sm:px-4 md:px-5 pt-24 sm:pt-20 md:pt-20 pb-3 sm:pb-4 md:pb-5">
        <main id="main-content" className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-lg h-[calc(100vh-108px)] sm:h-[calc(100vh-104px)] md:h-[calc(100vh-88px)] flex flex-col backdrop-blur-xl">
          <div className="mb-2 sm:mb-3">
            <ControlButtons
              onFormat={handleFormat}
              onCompact={handleCompact}
              onClear={handleClear}
              onCopy={handleCopy}
              onPaste={handlePaste}
              onExampleClick={() => setShowExampleModal(true)}
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
          
          <div className="flex-1 overflow-hidden">
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
                <TreeView
                  json={parsedJson}
                  onUpdate={handleTreeUpdate}
                />
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
        </main>
      </div>
      
      {showExampleModal && (
        <JsonExampleModal
          onSelect={handleExampleSelect}
          onClose={() => setShowExampleModal(false)}
        />
      )}
    </>
  );
}