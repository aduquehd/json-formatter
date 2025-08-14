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
          showWarning(`JSON was automatically fixed: ${result.fixes.join(', ')}`);
        }, 100);
      } else {
        showSuccess('JSON formatted successfully');
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
          showWarning(`JSON was automatically fixed: ${result.fixes.join(', ')}`);
        }, 100);
      } else {
        showSuccess('JSON compacted successfully');
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
      
      // Check if the content is valid JSON
      try {
        JSON.parse(editorContent);
        showSuccess('JSON copied to clipboard');
      } catch {
        showWarning('Content copied (Note: Invalid JSON)');
      }
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
            showWarning(`JSON was automatically fixed: ${result.fixes.join(', ')}`);
          }, 100);
        } else {
          // JSON was valid
          showSuccess('JSON pasted and formatted successfully');
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