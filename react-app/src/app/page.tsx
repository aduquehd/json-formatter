'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ControlButtons from '@/components/ControlButtons';
import TabsContainer from '@/components/TabsContainer';
import EditorView from '@/components/EditorView';
import TreeView from '@/components/TreeView';
import GraphView from '@/components/GraphView';
import DiffView from '@/components/DiffView';
import StatsView from '@/components/StatsView';
import MapView from '@/components/MapView';
import ChartView from '@/components/ChartView';
import SearchView from '@/components/SearchView';
import JsonExampleModal from '@/components/JsonExampleModal';
import { useTheme } from '@/hooks/useTheme';
import { useNotification } from '@/hooks/useNotification';
import { JSONFixer } from '@/utils/jsonFixer';
import { formatJSON, compactJSON } from '@/utils/jsonUtils';

export default function Home() {
  const [editorContent, setEditorContent] = useState('');
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('formatted');
  const [showExampleModal, setShowExampleModal] = useState(false);
  const [isUpdatingFromTree, setIsUpdatingFromTree] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { showSuccess, showError, showWarning } = useNotification();

  useEffect(() => {
    if (!isUpdatingFromTree && editorContent) {
      const result = JSONFixer.parseWithFixInfo(editorContent);
      if (result.error) {
        setParsedJson(null);
      } else {
        if (result.wasFixed && result.fixes) {
          showWarning(`JSON was automatically fixed: ${result.fixes.join(', ')}`);
        }
        setParsedJson(result.data);
      }
    } else if (!editorContent) {
      setParsedJson(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorContent, isUpdatingFromTree]);

  const handleFormat = () => {
    if (!editorContent || editorContent.trim() === '') {
      showError('Please enter some JSON to format');
      return;
    }
    
    try {
      const formatted = formatJSON(editorContent);
      setEditorContent(formatted);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Invalid JSON format');
    }
  };

  const handleCompact = () => {
    if (!editorContent || editorContent.trim() === '') {
      showError('Please enter some JSON to compact');
      return;
    }
    
    try {
      const compacted = compactJSON(editorContent);
      setEditorContent(compacted);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Invalid JSON format');
    }
  };

  const handleClear = () => {
    setEditorContent('');
    setParsedJson(null);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editorContent);
    } catch (error) {
      showError('Failed to copy');
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || text.trim() === '') {
        showError('Clipboard is empty');
        return;
      }
      
      setEditorContent(text);
      setActiveTab('formatted');
      
      // Try to format the pasted content
      try {
        const formatted = formatJSON(text);
        // Use setTimeout to ensure state update happens after setEditorContent
        setTimeout(() => {
          setEditorContent(formatted);
        }, 10);
      } catch (error) {
        // If formatting fails, just show the pasted content
      }
    } catch (error) {
      showError('Failed to paste - please check clipboard permissions');
    }
  };

  const handleExampleSelect = (exampleContent: string) => {
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
      <Navbar theme={theme} onThemeToggle={toggleTheme} />
      <div className="container mx-auto px-5 pt-20 pb-5">
        <main id="main-content" className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl p-5 shadow-lg h-[calc(100vh-88px)] flex flex-col backdrop-blur-xl">
          <div className="flex justify-between items-center mb-2 gap-3">
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
          
          <TabsContainer activeTab={activeTab} onTabChange={setActiveTab} />
          
          <div className="flex-1 overflow-hidden">
            {activeTab === 'formatted' && (
              <EditorView
                content={editorContent}
                onChange={setEditorContent}
                theme={theme}
              />
            )}
            {activeTab === 'tree' && (
              <TreeView
                json={parsedJson}
                onUpdate={handleTreeUpdate}
              />
            )}
            {activeTab === 'graph' && (
              <GraphView json={parsedJson} />
            )}
            {activeTab === 'diff' && (
              <DiffView json={parsedJson} />
            )}
            {activeTab === 'stats' && (
              <StatsView json={parsedJson} />
            )}
            {activeTab === 'map' && (
              <MapView json={parsedJson} />
            )}
            {activeTab === 'chart' && (
              <ChartView json={parsedJson} />
            )}
            {activeTab === 'search' && (
              <SearchView json={parsedJson} />
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